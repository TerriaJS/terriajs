'use strict';

/*global require*/
var L = require('leaflet');
var html2canvas = require('terriajs-html2canvas');

var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var CesiumTileLayer = require('../Map/CesiumTileLayer');
var MapboxVectorCanvasTileLayer = require('../Map/MapboxVectorCanvasTileLayer');
var MapboxVectorTileImageryProvider = require('../Map/MapboxVectorTileImageryProvider');
var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var EasingFunction = require('terriajs-cesium/Source/Core/EasingFunction');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var ImagerySplitDirection = require('terriajs-cesium/Source/Scene/ImagerySplitDirection');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var cesiumRequestAnimationFrame = require('terriajs-cesium/Source/Core/requestAnimationFrame');
var TweenCollection = require('terriajs-cesium/Source/Scene/TweenCollection');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var FeatureDetection = require('terriajs-cesium/Source/Core/FeatureDetection');

var Feature = require('./Feature');
var GlobeOrMap = require('./GlobeOrMap');
var inherit = require('../Core/inherit');
var LeafletDragBox = require('../Map/LeafletDragBox');
var LeafletScene = require('../Map/LeafletScene');
var PickedFeatures = require('../Map/PickedFeatures');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');
var runLater = require('../Core/runLater');
const selectionIndicatorUrl = require('../../wwwroot/images/NM-LocationTarget.svg');

// Work around broken html2canvas 0.5.0-alpha2
window.html2canvas = html2canvas;

LeafletDragBox.initialize(L);

// Monkey patch this fix into L.Canvas:
// https://github.com/Leaflet/Leaflet/pull/6033
// This is needed as of Leaflet 1.3.1, but will not be needed in the next version.
const originalDestroyContainer = L.Canvas.prototype._destroyContainer;
L.Canvas.prototype._destroyContainer = function() {
    L.Util.cancelAnimFrame(this._redrawRequest);
    originalDestroyContainer.apply(this, arguments);
};

// Function taken from Leaflet 1.0.1 (https://github.com/Leaflet/Leaflet/blob/v1.0.1/src/layer/vector/Canvas.js#L254-L267)
// Leaflet 1.0.2 and later don't trigger click events for every Path, so feature selection only gives 1 result.
// Updated to incorporate function changes up to v1.3.1
L.Canvas.prototype._onClick = function (e) {
    var point = this._map.mouseEventToLayerPoint(e), layers = [], layer;

    for (var order = this._drawFirst; order; order = order.next) {
        layer = order.layer;
        if (layer.options.interactive && layer._containsPoint(point) && !this._map._draggableMoved(layer)) {
            L.DomEvent.fakeStop(e);
            layers.push(layer);
        }
    }
    if (layers.length)  {
        this._fireEvent(layers, e);
    }
};

/**
 * The Leaflet viewer component
 *
 * @alias Leaflet
 * @constructor
 * @extends GlobeOrMap
 *
 * @param {Terria} terria The Terria instance.
 * @param {Map} map The leaflet map instance.
 */
var Leaflet = function(terria, map) {
    GlobeOrMap.call(this, terria);

    /**
     * Gets or sets the Leaflet {@link Map} instance.
     * @type {Map}
     */
    this.map = map;

    this.scene = new LeafletScene(map);

    /**
     * Gets or sets whether this viewer _can_ show a splitter.
     * @type {Boolean}
     */
    this.canShowSplitter = true;

    /**
     * Gets the {@link LeafletDataSourceDisplay} used to render a {@link DataSource}.
     * @type {LeafletDataSourceDisplay}
     */
    this.dataSourceDisplay = undefined;

    this._tweens = new TweenCollection();
    this._tweensAreRunning = false;
    this._selectionIndicatorTween = undefined;
    this._selectionIndicatorIsAppearing = undefined;

    this._pickedFeatures = undefined;
    this._selectionIndicator = L.marker([0, 0], {
        icon: L.divIcon({
            className: '',
            html: '<img src="' + selectionIndicatorUrl + '" width="50" height="50" alt="" />',
            iconSize: L.point(50, 50)
        }),
        zIndexOffset: 1,    // We increment the z index so that the selection marker appears above the item.
        interactive: false,
        keyboard: false
    });
    this._selectionIndicator.addTo(this.map);
    this._selectionIndicatorDomElement = this._selectionIndicator._icon.children[0];

    this._dragboxcompleted = false;
    this._pauseMapInteractionCount = 0;

    this.scene.featureClicked.addEventListener(featurePicked.bind(undefined, this));

    var that = this;

    // if we receive dragboxend (see LeafletDragBox) and we are currently
    // accepting a rectangle, then return the box as the picked feature
    map.on('dragboxend', function(e) {
        var mapInteractionModeStack = that.terria.mapInteractionModeStack;
        if (defined(mapInteractionModeStack) && mapInteractionModeStack.length > 0) {
	       if (mapInteractionModeStack[mapInteractionModeStack.length - 1].drawRectangle && defined(e.dragBoxBounds)) {
			    var b = e.dragBoxBounds;
                mapInteractionModeStack[mapInteractionModeStack.length - 1].pickedFeatures = Rectangle.fromDegrees(b.getWest(), b.getSouth(), b.getEast(), b.getNorth());
			}
        }
		that._dragboxcompleted = true;
    });

    map.on('click', function(e) {
        if (!that._dragboxcompleted && that.map.dragging.enabled()) {
            pickFeatures(that, e.latlng);
        }
        that._dragboxcompleted = false;
    });

    this._selectedFeatureSubscription = knockout.getObservable(this.terria, 'selectedFeature').subscribe(function() {
        selectFeature(this);
    }, this);

    this._splitterPositionSubscription = knockout.getObservable(this.terria, 'splitPosition').subscribe(function() {
        this.updateAllItemsForSplitter();
    }, this);

    this._showSplitterSubscription = knockout.getObservable(terria, 'showSplitter').subscribe(function() {
        this.updateAllItemsForSplitter();
    }, this);

    map.on('layeradd', function(e) {
        that.updateAllItemsForSplitter();
    });

    map.on('move', function(e) {
        that.updateAllItemsForSplitter();
    });

    this._initProgressEvent();

    selectFeature(this);
};

inherit(GlobeOrMap, Leaflet);

Leaflet.prototype._initProgressEvent = function() {
    var onTileLoadChange = function() {
        var tilesLoadingCount = 0;

        this.map.eachLayer(function(layer) {
            if (layer._tiles) {
                // Count all tiles not marked as loaded
                tilesLoadingCount += Object.keys(layer._tiles).filter(key => !layer._tiles[key].loaded).length;
            }
        });

        this.updateTilesLoadingCount(tilesLoadingCount);
    }.bind(this);

    this.map.on('layeradd', function(evt) {
        // This check makes sure we only watch tile layers, and also protects us if this private variable gets changed.
        if (typeof evt.layer._tiles !== 'undefined') {
            evt.layer.on('tileloadstart tileload load', onTileLoadChange);
        }
    }.bind(this));

    this.map.on('layerremove', function(evt) {
        evt.layer.off('tileloadstart tileload load', onTileLoadChange);
    }.bind(this));
};

Leaflet.prototype.destroy = function() {
    if (defined(this._selectedFeatureSubscription)) {
        this._selectedFeatureSubscription.dispose();
        this._selectedFeatureSubscription = undefined;
    }

    if (defined(this._splitterPositionSubscription)) {
        this._splitterPositionSubscription.dispose();
        this._splitterPositionSubscription = undefined;
    }

    if (defined(this._showSplitterSubscription)) {
        this._showSplitterSubscription.dispose();
        this._showSplitterSubscription = undefined;
    }

    this.map.clearAllEventListeners();
    this.map.eachLayer(layer => layer.clearAllEventListeners());

    GlobeOrMap.disposeCommonListeners(this);

    return destroyObject(this);
};

/**
 * Gets the current extent of the camera.  This may be approximate if the viewer does not have a strictly rectangular view.
 * @return {Rectangle} The current visible extent.
 */
Leaflet.prototype.getCurrentExtent = function() {
    var bounds = this.map.getBounds();
    return Rectangle.fromDegrees(bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth());
};

/**
 * Gets the current container element.
 * @return {Element} The current container element.
 */
Leaflet.prototype.getContainer = function() {
    return this.map.getContainer();
};

/**
 * Zooms to a specified camera view or extent.
 *
 * @param {CameraView|Rectangle|DataSource} target The view, extent or DataSource to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.  Leaflet ignores the actual value,
 *                                             but will use an animated transition when this value is greater than 0.
 */
Leaflet.prototype.zoomTo = function(target, flightDurationSeconds) {
    if (!defined(target)) {
        throw new DeveloperError('target is required.');
    }

    var that = this;

    return when().then(function() {
        var bounds;

        // Target is a KML data source
        if (defined(target.entities)) {
            var dataSourceDisplay = that.dataSourceDisplay;
            bounds = dataSourceDisplay.getLatLngBounds(target);
        } else {
            var extent;

            if (target instanceof Rectangle) {
                extent = target;
            } else {
                extent = target.rectangle;
            }

            // Account for a bounding box crossing the date line.
            if (extent.east < extent.west) {
                extent = Rectangle.clone(extent);
                extent.east += CesiumMath.TWO_PI;
            }
            bounds = rectangleToLatLngBounds(extent);
        }

        if (defined(bounds)) {
            that.map.flyToBounds(bounds, {
                animate: flightDurationSeconds > 0.0,
                duration: flightDurationSeconds
            });
        }
    });

};

function isSplitterDragThumb(element) {
    return element.className && element.className.indexOf && element.className.indexOf('tjs-splitter__thumb') >= 0;
}

/**
 * Captures a screenshot of the map.
 * @return {Promise} A promise that resolves to a data URL when the screenshot is ready.
 */
Leaflet.prototype.captureScreenshot = function() {
    // Temporarily hide the map credits.
    this.map.attributionControl.remove();

    var that = this;

    let restoreLeft;
    let restoreRight;

    try {
        // html2canvas can't handle the clip style which is used for the splitter. So if the splitter is active, we render
        // a left image and a right image and compose them. Also remove the splitter drag thumb.
        let promise;
        if (this.terria.showSplitter) {
            const clips = getClipsForSplitter(this);
            const clipLeft = clips.left.replace(/ /g, '');
            const clipRight = clips.right.replace(/ /g, '');
            promise = html2canvas(this.map.getContainer(), {
                useCORS: true,
                ignoreElements: element => element.style && element.style.clip.replace(/ /g, '') === clipRight || isSplitterDragThumb(element)
            }).then(leftCanvas => {
                return html2canvas(this.map.getContainer(), {
                    useCORS: true,
                    ignoreElements: element => element.style && element.style.clip.replace(/ /g, '') === clipLeft || isSplitterDragThumb(element)
                }).then(rightCanvas => {
                    const combined = document.createElement('canvas');
                    combined.width = leftCanvas.width;
                    combined.height = leftCanvas.height;
                    const context = combined.getContext('2d');
                    const split = clips.clipPositionWithinMap * window.devicePixelRatio;
                    context.drawImage(leftCanvas, 0, 0, split, combined.height, 0, 0, split, combined.height);
                    context.drawImage(rightCanvas, split, 0, combined.width - split, combined.height, split, 0, combined.width - split, combined.height);
                    return combined;
                });
            });
        } else {
            promise = html2canvas(this.map.getContainer(), {
                useCORS: true
            });
        }

        return when(promise).then(function(canvas) {
            return canvas.toDataURL("image/png");
        }).always(function(v) {
            that.map.attributionControl.addTo(that.map);
            if (restoreLeft) {
                restoreLeft();
            }
            if (restoreRight) {
                restoreRight();
            }
            return v;
        });
    } catch (e) {
        that.map.attributionControl.addTo(that.map);
        if (restoreLeft) {
            restoreLeft();
        }
        if (restoreRight) {
            restoreRight();
        }
        return when.reject(e);
    }
};

/**
 * Notifies the viewer that a repaint is required.
 */
Leaflet.prototype.notifyRepaintRequired = function() {
    // Leaflet doesn't need to do anything with this notification.
};

var cartographicScratch = new Cartographic();

/**
 * Computes the screen position of a given world position.
 * @param  {Cartesian3} position The world position in Earth-centered Fixed coordinates.
 * @param  {Cartesian2} [result] The instance to which to copy the result.
 * @return {Cartesian2} The screen position, or undefined if the position is not on the screen.
 */
Leaflet.prototype.computePositionOnScreen = function(position, result) {
    var cartographic = Ellipsoid.WGS84.cartesianToCartographic(position, cartographicScratch);
    var point = this.map.latLngToContainerPoint(L.latLng(CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude)));

    if (defined(result)) {
        result.x = point.x;
        result.y = point.y;
    } else {
        result = new Cartesian2(point.x, point.y);
    }
    return result;
};

/**
 * Adds an attribution to the map.
 * @param {Credit} attribution The attribution to add.
 */
Leaflet.prototype.addAttribution = function(attribution) {
    if (attribution) {
        this.map.attributionControl.addAttribution(createLeafletCredit(attribution));
    }
};

/**
 * Removes an attribution from the map.
 * @param {Credit} attribution The attribution to remove.
 */
Leaflet.prototype.removeAttribution = function(attribution) {
    if (attribution) {
        this.map.attributionControl.removeAttribution(createLeafletCredit(attribution));
    }
};

/**
 * Gets all attribution currently active on the globe or map.
 * @returns {String[]} The list of current attributions, as HTML strings.
 */
Leaflet.prototype.getAllAttribution = function() {
    return Object.keys(this.map.attributionControl._attributions);
};

// this private function is called by updateLayerOrder
function updateOneLayer(item, currZIndex) {
    if (defined(item.imageryLayer) && defined(item.imageryLayer.setZIndex)) {
        if (item.supportsReordering) {
            item.imageryLayer.setZIndex(currZIndex.reorderable++);
        } else {
            item.imageryLayer.setZIndex(currZIndex.fixed++);
        }
    }
}
/**
 * Updates the order of layers on the Leaflet map to match the order in the Now Viewing pane.
 */
Leaflet.prototype.updateLayerOrder = function() {
    // Set the current z-index of all layers.
    var items = this.terria.nowViewing.items;
    var currZIndex = {
        reorderable: 100, // an arbitrary place to start
        fixed: 1000000 // fixed layers go on top of reorderable ones
    };
    var i, j, currentItem, subItem;

    for (i = items.length - 1; i >= 0; --i) {
        currentItem = items[i];
        if (defined(currentItem.items)) {
            for (j = currentItem.items.length - 1; j >= 0; --j) {
                subItem = currentItem.items[j];
                updateOneLayer(subItem, currZIndex);
            }
        }
        updateOneLayer(currentItem, currZIndex);
    }
};

/**
 * Because Leaflet doesn't actually do raise/lower, just reset the orders after every raise/lower
 */
Leaflet.prototype.updateLayerOrderAfterReorder = function() {
    this.updateLayerOrder();
};

Leaflet.prototype.raise = function(index) {
    // raising and lowering is instead handled by updateLayerOrderAfterReorder
};

Leaflet.prototype.lower = function(index) {
    // raising and lowering is instead handled by updateLayerOrderAfterReorder
};

/**
 * Lowers this imagery layer to the bottom, underneath all other layers.  If this item is not enabled or not shown,
 * this method does nothing.
 * @param {CatalogItem} item The item to lower to the bottom (usually a basemap)
 */
Leaflet.prototype.lowerToBottom = function(item) {
    if (defined(item.items)) {
        for (var i = item.items.length - 1; i >= 0; --i) {
            var subItem = item.items[i];
            this.lowerToBottom(subItem);  // recursive
        }
    }

    if (!defined(item._imageryLayer)) {
        return;
    }

    item._imageryLayer.setZIndex(0);
};

/**
 * Picks features based off a latitude, longitude and (optionally) height.
 * @param {Object} latlng The position on the earth to pick.
 * @param {Object} imageryLayerCoords A map of imagery provider urls to the coords used to get features for those imagery
 *     providers - i.e. x, y, level
 * @param existingFeatures An optional list of existing features to concatenate the ones found from asynchronous picking to.
 */
Leaflet.prototype.pickFromLocation = function(latlng, imageryLayerCoords, existingFeatures) {
    pickFeatures(this, latlng, imageryLayerCoords, existingFeatures);
};

/**
 * Returns a new layer using a provided ImageryProvider.
 * Does not add it to anything - in Leaflet there is no equivalent to Cesium's ability to add a layer without showing it,
 * so here this is done by show/hide.
 * Note the optional parameters are a subset of the Cesium version of this function, with one addition (onProjectionError).
 *
 * @param {Object} options Options
 * @param {ImageryProvider} options.imageryProvider The imagery provider to create a new layer for.
 * @param {Rectangle} [options.rectangle=imageryProvider.rectangle] The rectangle of the layer.  This rectangle
 *        can limit the visible portion of the imagery provider.
 * @param {Number} [options.opacity=1.0] The alpha blending value of this layer, from 0.0 to 1.0.
 * @param {Boolean} [options.clipToRectangle]
 * @param {Function} [options.onLoadError]
 * @param {Function} [options.onProjectionError]
 * @returns {ImageryLayer} The newly created layer.
 */
Leaflet.prototype.addImageryProvider = function(options) {
    var layerOptions = {
        opacity: options.opacity,
        bounds : options.clipToRectangle && options.rectangle ? rectangleToLatLngBounds(options.rectangle) : undefined
    };

    if (defined(this.map.options.maxZoom)) {
        layerOptions.maxZoom = this.map.options.maxZoom;
    }

    var result;

    if (options.imageryProvider instanceof MapboxVectorTileImageryProvider) {
        layerOptions.async = true;
        layerOptions.bounds = rectangleToLatLngBounds(options.imageryProvider.rectangle);
        result = new MapboxVectorCanvasTileLayer(options.imageryProvider, layerOptions);
    }
    else {
        result = new CesiumTileLayer(options.imageryProvider, layerOptions);
    }

    result.errorEvent.addEventListener(function(sender, message) {
        if (defined(options.onProjectionError)) {
            options.onProjectionError();
        }

        // If the user re-shows the dataset, show the error again.
        result.initialized = false;
    });

    var errorEvent = options.imageryProvider.errorEvent;
    if (defined(options.onLoadError) && defined(errorEvent)) {
        errorEvent.addEventListener(options.onLoadError);
    }

    return result;
};

Leaflet.prototype.removeImageryLayer = function(options) {
    var map = this.map;
    // Comment - Leaflet.prototype.addImageryProvider doesn't add the layer to the map,
    // so it seems inconsistent that removeImageryLayer removes it.
    // (In contrast, Cesium.prototype.addImageryProvider does add it to the scene, and removeImageryLayer removes it from the scene).
    map.removeLayer(options.layer);
};

Leaflet.prototype.showImageryLayer = function(options) {
    if (!this.map.hasLayer(options.layer)) {
        this.map.addLayer(options.layer);  // Identical to layer.addTo(this.map), as Leaflet's L.layer.addTo(map) just calls map.addLayer.
    }
    this.updateLayerOrder();
};

Leaflet.prototype.hideImageryLayer = function(options) {
    this.map.removeLayer(options.layer);
};

Leaflet.prototype.isImageryLayerShown = function(options) {
    return this.map.hasLayer(options.layer);
};

// As of Internet Explorer 11.483.15063.0 and Edge 40.15063.0.0 (EdgeHTML 15.15063) there is an apparent
// bug in both browsers where setting the `clip` CSS style on our Leaflet layers does not consistently
// cause the new clip to be applied.  The change shows up in the DOM inspector, but it is not reflected
// in the rendered view.  You can reproduce it by adding a layer and toggling it between left/both/right
// repeatedly, and you will quickly see it fail to update sometimes.  Unfortunateely my attempts to
// reproduce this in jsfiddle were unsuccessful, so presumably there is something unusual about our
// setup.  In any case, we do the usually-horrible thing here of detecting these browsers by their user
// agent, and then work around the bug by hiding the DOM element, forcing it to updated by asking for
// its bounding client rectangle, and then showing it again.  There's a bit of a performance hit to
// this, so we don't do it on other browsers that do not experience this bug.
const useClipUpdateWorkaround = FeatureDetection.isInternetExplorer() || FeatureDetection.isEdge();

Leaflet.prototype.updateItemForSplitter = function(item, clips) {
    if (!defined(item.splitDirection) || !defined(item.imageryLayer)) {
        return;
    }

    const layer = item.imageryLayer;
    const container = layer.getContainer && layer.getContainer();
    if (!container) {
        return;
    }

    const { left: clipLeft, right: clipRight } = clips || getClipsForSplitter(this);

    if (container) {
        let display;
        if (useClipUpdateWorkaround) {
            display = container.style.display;
            container.style.display = 'none';
            container.getBoundingClientRect();
        }

        if (item.splitDirection === ImagerySplitDirection.LEFT) {
            container.style.clip = clipLeft;
        } else if (item.splitDirection === ImagerySplitDirection.RIGHT) {
            container.style.clip = clipRight;
        } else {
            container.style.clip = 'auto';
        }

        // Also update the next layer, if any.
        if (item._nextLayer && item._nextLayer.getContainer && item._nextLayer.getContainer()) {
            item._nextLayer.getContainer().style.clip = container.style.clip;
        }

        if (useClipUpdateWorkaround) {
            container.style.display = display;
        }
    }
};

Leaflet.prototype.updateAllItemsForSplitter = function() {
    const clips = getClipsForSplitter(this);
    this.terria.nowViewing.items.forEach(item => {
        this.updateItemForSplitter(item, clips);
    });
};

Leaflet.prototype.pauseMapInteraction = function() {
    ++this._pauseMapInteractionCount;
    if (this._pauseMapInteractionCount === 1) {
        this.map.dragging.disable();
    }
};

Leaflet.prototype.resumeMapInteraction = function() {
    --this._pauseMapInteractionCount;
    if (this._pauseMapInteractionCount === 0) {
        setTimeout(() => {
            if (this._pauseMapInteractionCount === 0) {
                this.map.dragging.enable();
            }
        }, 0);
    }
};

function getClipsForSplitter(viewer) {
    let clipLeft = '';
    let clipRight = '';
    let clipPositionWithinMap;
    let clipX;
    if (viewer.terria.showSplitter) {
        const map = viewer.map;
        const size = map.getSize();
        const nw = map.containerPointToLayerPoint([0, 0]);
        const se = map.containerPointToLayerPoint(size);
        clipPositionWithinMap = size.x * viewer.terria.splitPosition;
        clipX = Math.round(nw.x + clipPositionWithinMap);
        clipLeft = 'rect(' + [nw.y, clipX, se.y, nw.x].join('px,') + 'px)';
        clipRight = 'rect(' + [nw.y, se.x, se.y, clipX].join('px,') + 'px)';
    }

    return {
        left: clipLeft,
        right: clipRight,
        clipPositionWithinMap: clipPositionWithinMap,
        clipX: clipX
    };
}

/**
 * A convenient function for handling leaflet credit display
 * @param {Credit} attribution the original attribution object for leaflet to display as text or link
 * @return {String} The sanitized HTML for the credit.
 */
function createLeafletCredit(attribution) {
    return attribution.element;
}

/*
* There are two "listeners" for clicks which are set up in our constructor.
* - One fires for any click: `map.on('click', ...`.  It calls `pickFeatures`.
* - One fires only for vector features: `this.scene.featureClicked.addEventListener`.
*    It calls `featurePicked`, which calls `pickFeatures` and then adds the feature it found, if any.
* These events can fire in either order.
* Billboards do not fire the first event.
*
* Note that `pickFeatures` does nothing if `leaflet._pickedFeatures` is already set.
* Otherwise, it sets it, runs `runLater` to clear it, and starts the asynchronous raster feature picking.
*
* So:
* If only the first event is received, it triggers the raster-feature picking as desired.
* If both are received in the order above, the second adds the vector features to the list of raster features as desired.
* If both are received in the reverse order, the vector-feature click kicks off the same behavior as the other click would have;
* and when the next click is received, it is ignored - again, as desired.
*/

function featurePicked(leaflet, entity, event) {
    pickFeatures(leaflet, event.latlng);

    // Ignore clicks on the feature highlight.
    if (entity && entity.entityCollection && entity.entityCollection.owner && entity.entityCollection.owner.name === GlobeOrMap._featureHighlightName) {
        return;
    }

    var feature = Feature.fromEntityCollectionOrEntity(entity);
    leaflet._pickedFeatures.features.push(feature);

    if (entity.position) {
        leaflet._pickedFeatures.pickPosition = entity.position._value;
    }
}

function pickFeatures(leaflet, latlng, tileCoordinates, existingFeatures) {
    if (defined(leaflet._pickedFeatures)) {
        // Picking is already in progress.
        return;
    }

    leaflet._pickedFeatures = new PickedFeatures();

    if (defined(existingFeatures)) {
        leaflet._pickedFeatures.features = existingFeatures;
    }

    // We run this later because vector click events and the map click event can come through in any order, but we can
    // be reasonably sure that all of them will be processed by the time our runLater func is invoked.
    var cleanup = runLater(function() {
        // Set this again just in case a vector pick came through and reset it to the vector's position.
        var newPickLocation = Ellipsoid.WGS84.cartographicToCartesian(pickedLocation);
        var mapInteractionModeStack = leaflet.terria.mapInteractionModeStack;
        if (defined(mapInteractionModeStack) && mapInteractionModeStack.length > 0) {
            mapInteractionModeStack[mapInteractionModeStack.length - 1].pickedFeatures.pickPosition = newPickLocation;
        } else if (defined(leaflet.terria.pickedFeatures)) {
            leaflet.terria.pickedFeatures.pickPosition = newPickLocation;
        }

        // Unset this so that the next click will start building features from scratch.
        leaflet._pickedFeatures = undefined;
    });

    var activeItems = leaflet.terria.nowViewing.items;
    tileCoordinates = defaultValue(tileCoordinates, {});

    var pickedLocation = Cartographic.fromDegrees(latlng.lng, latlng.lat);
    leaflet._pickedFeatures.pickPosition = Ellipsoid.WGS84.cartographicToCartesian(pickedLocation);

    // We want the all available promise to return after the cleanup one to make sure all vector click events have resolved.
    var promises = [cleanup].concat(activeItems.filter(function(item) {
        return item.isEnabled && item.isShown && defined(item.imageryLayer) && defined(item.imageryLayer.pickFeatures);
    }).map(function(item) {
        var imageryLayerUrl = item.imageryLayer.imageryProvider.url;
        var longRadians = CesiumMath.toRadians(latlng.lng);
        var latRadians = CesiumMath.toRadians(latlng.lat);

        return when(tileCoordinates[imageryLayerUrl] || item.imageryLayer.getFeaturePickingCoords(leaflet.map, longRadians, latRadians))
            .then(function(coords) {
                return item.imageryLayer.pickFeatures(coords.x, coords.y, coords.level, longRadians, latRadians).then(function(features) {
                    return {
                        features: features,
                        imageryLayer: item.imageryLayer,
                        coords: coords
                    };
                });
            });
    }));

    var pickedFeatures = leaflet._pickedFeatures;
    pickedFeatures.allFeaturesAvailablePromise = when.all(promises).then(function(results) {
        // Get rid of the cleanup promise
        var promiseResult = results.slice(1);

        pickedFeatures.isLoading = false;
        pickedFeatures.providerCoords = {};

        var filteredResults = promiseResult.filter(function(result) {
            return defined(result.features) && result.features.length > 0;
        });

        pickedFeatures.providerCoords = filteredResults.reduce(function(coordsSoFar, result) {
            coordsSoFar[result.imageryLayer.imageryProvider.url] = result.coords;
            return coordsSoFar;
        }, {});

        pickedFeatures.features = filteredResults.reduce(function(allFeatures, result) {
            return allFeatures.concat(result.features.map(function(feature) {
                feature.imageryLayer = result.imageryLayer;

                // For features without a position, use the picked location.
                if (!defined(feature.position)) {
                    feature.position = pickedLocation;
                }

                return leaflet._createFeatureFromImageryLayerFeature(feature);
            }));
        }, pickedFeatures.features);
    }).otherwise(function(e) {
        pickedFeatures.isLoading = false;
        pickedFeatures.error = 'An unknown error occurred while picking features.';

        throw e;
    });

    var mapInteractionModeStack = leaflet.terria.mapInteractionModeStack;
    if (defined(mapInteractionModeStack) && mapInteractionModeStack.length > 0) {
        mapInteractionModeStack[mapInteractionModeStack.length - 1].pickedFeatures = leaflet._pickedFeatures;
    } else {
        leaflet.terria.pickedFeatures = leaflet._pickedFeatures;
    }
}

function selectFeature(leaflet) {
    var feature = leaflet.terria.selectedFeature;

    leaflet._highlightFeature(feature);

    if (defined(feature) && defined(feature.position)) {
        var cartographic = Ellipsoid.WGS84.cartesianToCartographic(feature.position.getValue(leaflet.terria.clock.currentTime), cartographicScratch);
        leaflet._selectionIndicator.setLatLng([CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude)]);
        animateSelectionIndicatorAppear(leaflet);
    } else {
        animateSelectionIndicatorDepart(leaflet);
    }
}

function startTweens(leaflet) {
    if (leaflet._tweensAreRunning) {
        return;
    }

    var feature = leaflet.terria.selectedFeature;
    if (defined(feature) && defined(feature.position)) {
        var cartographic = Ellipsoid.WGS84.cartesianToCartographic(feature.position.getValue(leaflet.terria.clock.currentTime), cartographicScratch);
        leaflet._selectionIndicator.setLatLng([CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude)]);
    }

    if (leaflet._tweens.length > 0) {
        leaflet._tweens.update();
    }

    if (leaflet._tweens.length !== 0 || (defined(feature) && defined(feature.position))) {
        cesiumRequestAnimationFrame(startTweens.bind(undefined, leaflet));
    }
}

function animateSelectionIndicatorAppear(leaflet) {
    if (defined(leaflet._selectionIndicatorTween)) {
        if (leaflet._selectionIndicatorIsAppearing) {
            // Already appearing; don't restart the animation.
            return;
        }
        leaflet._selectionIndicatorTween.cancelTween();
        leaflet._selectionIndicatorTween = undefined;
    }

    var style = leaflet._selectionIndicatorDomElement.style;

    leaflet._selectionIndicatorIsAppearing = true;
    leaflet._selectionIndicatorTween = leaflet._tweens.add({
        startObject: {
            scale: 2.0,
            opacity: 0.0,
            rotate: -180
        },
        stopObject: {
            scale: 1.0,
            opacity: 1.0,
            rotate: 0
        },
        duration: 0.8,
        easingFunction: EasingFunction.EXPONENTIAL_OUT,
        update: function(value) {
            style.opacity = value.opacity;
            style.transform = 'scale(' + (value.scale) + ') rotate(' + value.rotate + 'deg)';
        },
        complete: function() {
            leaflet._selectionIndicatorTween = undefined;
        },
        cancel: function() {
            leaflet._selectionIndicatorTween = undefined;
        }
    });

    startTweens(leaflet);
}

function animateSelectionIndicatorDepart(leaflet) {
    if (defined(leaflet._selectionIndicatorTween)) {
        if (!leaflet._selectionIndicatorIsAppearing) {
            // Already disappearing, dont' restart the animation.
            return;
        }
        leaflet._selectionIndicatorTween.cancelTween();
        leaflet._selectionIndicatorTween = undefined;
    }

    var style = leaflet._selectionIndicatorDomElement.style;

    leaflet._selectionIndicatorIsAppearing = false;
    leaflet._selectionIndicatorTween = leaflet._tweens.add({
        startObject: {
            scale: 1.0,
            opacity: 1.0
        },
        stopObject: {
            scale: 1.5,
            opacity: 0.0
        },
        duration: 0.8,
        easingFunction: EasingFunction.EXPONENTIAL_OUT,
        update: function(value) {
            style.opacity = value.opacity;
            style.transform = 'scale(' + value.scale + ') rotate(0deg)';
        },
        complete: function() {
            leaflet._selectionIndicatorTween = undefined;
        },
        cancel: function() {
            leaflet._selectionIndicatorTween = undefined;
        }
    });

    startTweens(leaflet);
}

module.exports = Leaflet;
