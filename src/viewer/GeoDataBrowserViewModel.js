"use strict";

/*global Cesium,require,alert*/

var ArcGisMapServerImageryProvider = Cesium.ArcGisMapServerImageryProvider;
var BingMapsImageryProvider = Cesium.BingMapsImageryProvider;
var BingMapsStyle = Cesium.BingMapsStyle;
var CesiumTerrainProvider = Cesium.CesiumTerrainProvider;
var combine = Cesium.combine;
var createCommand = Cesium.createCommand;
var defined = Cesium.defined;
var defineProperties = Cesium.defineProperties;
var EllipsoidTerrainProvider = Cesium.EllipsoidTerrainProvider;
var loadJson = Cesium.loadJson;
var Rectangle = Cesium.Rectangle;
var TileMapServiceImageryProvider = Cesium.TileMapServiceImageryProvider;
var when = Cesium.when;

var corsProxy = require('../corsProxy');
var GeoData = require('../GeoData');
var GeoDataInfoPopup = require('./GeoDataInfoPopup');
var readJson = require('../readJson');
var knockout = require('knockout');
var komapping = require('knockout.mapping');
var knockoutES5 = require('../../public/third_party/knockout-es5.js');

var GeoDataBrowserViewModel = function(options) {
    this._viewer = options.viewer;
    this._dataManager = options.dataManager;
    this.map = options.map;

    this.showingPanel = false;
    this.showingMapPanel = false;
    this.openIndex = 0;
    this.addDataIsOpen = false;
    this.nowViewingIsOpen = false;
    this.wfsServiceUrl = '';

    this.openMapIndex = 0;
    this.imageryIsOpen = true;
    this.viewerSelectionIsOpen = false;
    this.selectedViewer = 'Terrain';

    knockout.track(this, ['showingPanel', 'showingMapPanel', 'openIndex', 'addDataIsOpen', 'nowViewingIsOpen', 'wfsServiceUrl',
                          'imageryIsOpen', 'viewerSelectionIsOpen', 'selectedViewer']);

    var that = this;

    // Create commands
    this._toggleShowingPanel = createCommand(function() {
        that.showingPanel = !that.showingPanel;
        if (that.showingPanel) {
            that.showingMapPanel = false;
        }
    });

    this._toggleShowingMapPanel = createCommand(function() {
        that.showingMapPanel = !that.showingMapPanel;
        if (that.showingMapPanel) {
            that.showingPanel = false;
        }
    });

    this._openItem = createCommand(function(item) {
        that.openIndex = that.content.indexOf(item);
        that.addDataIsOpen = false;
        that.nowViewingIsOpen = false;
    });

    this._openAddData = createCommand(function() {
        that.openIndex = -1;
        that.addDataIsOpen = true;
        that.nowViewingIsOpen = false;
    });

    this._openNowViewing = createCommand(function() {
        that.openIndex = -1;
        that.addDataIsOpen = false;
        that.nowViewingIsOpen = true;
    });

    this._openImagery = createCommand(function() {
        that.imageryIsOpen = true;
        that.viewerSelectionIsOpen = false;
    });

    this._openViewerSelection = createCommand(function() {
        that.imageryIsOpen = false;
        that.viewerSelectionIsOpen = true;
    });

    this._toggleCategoryOpen = createCommand(function(item) {
        item.isOpen(!item.isOpen());
    });

    this._toggleItemEnabled = createCommand(function(item) {
        item.isEnabled(!item.isEnabled());

        if (item.isEnabled()) {
            enableItem(that, item);
        } else {
            disableItem(that, item);
        }
    });

    this._toggleItemShown = createCommand(function(item) {
        item.show(!item.show());
        that._dataManager.show(item.model, item.show());
    });

    this._zoomToItem = createCommand(function(item) {
        if (!defined(item.layer) || !defined(item.layer.extent)) {
            return;
        }
        that._viewer.updateCameraFromRect(item.layer.extent, 1000);
    });

    this._showInfoForItem = createCommand(function(item) {
        var popup = new GeoDataInfoPopup({
            container : document.body,
            viewModel : item
        });
    });

    this._addWfsService = createCommand(function() {
        var item = that._browserContentMapping.Layer.create({
            data : {
                name : that.wfsServiceUrl,
                base_url : that.wfsServiceUrl,
                type : 'WFS',
                proxy : true
            }
        });
        that.userContent.push(item);

        item.isOpen(true);

        that.wfsServiceUrl = '';
    });

    function removeBaseLayer() {
        if (!defined(that._viewer.viewer)) {
            var message = 'Base layer selection is not yet implemented for Leaflet.';
            alert(message);
            throw message;
        }
        var imageryLayers = that._viewer.scene.globe.imageryLayers;

        var previousBaseLayer = imageryLayers.get(0);
        imageryLayers.remove(previousBaseLayer);
    }

    function switchToBingMaps(style) {
        removeBaseLayer();

        var imageryLayers = that._viewer.scene.globe.imageryLayers;
        imageryLayers.addImageryProvider(new BingMapsImageryProvider({
            url : '//dev.virtualearth.net',
            mapStyle : style
        }), 0);
    }

    this._activateBingMapsAerialWithLabels = createCommand(function() {
        switchToBingMaps(BingMapsStyle.AERIAL_WITH_LABELS);
    });

    this._activateBingMapsAerial = createCommand(function() {
        switchToBingMaps(BingMapsStyle.AERIAL);
    });

    this._activateBingMapsRoads = createCommand(function() {
        switchToBingMaps(BingMapsStyle.ROAD);
    });

    this._activateNasaBlackMarble = createCommand(function() {
        removeBaseLayer();

        var imageryLayers = that._viewer.scene.globe.imageryLayers;
        imageryLayers.addImageryProvider(new TileMapServiceImageryProvider({
            url : '//cesiumjs.org/tilesets/imagery/blackmarble',
            credit : '© Analytical Graphics, Inc.'
        }), 0);
    });

    this._activateNaturalEarthII = createCommand(function() {
        removeBaseLayer();

        var imageryLayers = that._viewer.scene.globe.imageryLayers;
        imageryLayers.addImageryProvider(new TileMapServiceImageryProvider({
            url : '//cesiumjs.org/tilesets/imagery/naturalearthii',
            credit : '© Analytical Graphics, Inc.'
        }), 0);
    });

    this._activateAustralianTopography = createCommand(function() {
        removeBaseLayer();

        var imageryLayers = that._viewer.scene.globe.imageryLayers;
        imageryLayers.addImageryProvider(new ArcGisMapServerImageryProvider({
            url : 'http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography_WM/MapServer',
            proxy : corsProxy
        }), 0);
    });

    this._selectFileToUpload = createCommand(function() {
        var element = document.getElementById('uploadFile');
        element.click();
    });

    this._addUploadedFile = createCommand(function() {
        var uploadFileElement = document.getElementById('uploadFile');
        var files = uploadFileElement.files;
        for (var i = 0; i < files.length; ++i) {
            that._viewer.geoDataManager.addFile(files[i]);
        }
    });

    // Subscribe to a change in the selected viewer (2D/3D) in order to actually switch the viewer.
    knockout.getObservable(this, 'selectedViewer').subscribe(function(value) {
        if (value === '2D') {
            if (that._viewer.isCesium()) {
                that._viewer.selectViewer(false);
            }
        } else {
            if (!that._viewer.isCesium()) {
                that._viewer.selectViewer(true);
            }

            var terrainProvider = that._viewer.scene.globe.terrainProvider;
            if (value === 'Ellipsoid' && !(terrainProvider instanceof EllipsoidTerrainProvider)) {
                that._viewer.scene.globe.terrainProvider = new EllipsoidTerrainProvider();
            } else if (value === 'Terrain' && !(terrainProvider instanceof CesiumTerrainProvider)) {
                that._viewer.scene.globe.terrainProvider = new CesiumTerrainProvider({
                    url : 'http://cesiumjs.org/stk-terrain/tilesets/world/tiles'
                });
            }
        }
    });

    this._itemMapping = {
        create : function(options) {
            var parent = komapping.toJS(options.parent);
            var data = combine(options.data, parent);

            var layerViewModel = komapping.fromJS(data, that._categoryMapping);
            layerViewModel.isEnabled = knockout.observable(false);

            return layerViewModel;
        }
    };

    this._categoryMapping = {
        Layer : this._itemMapping
    };

    this._browserContentMapping = {
        Layer : {
            create : function(options) {
                var layerViewModel = komapping.fromJS(options.data, that._categoryMapping);
                layerViewModel.isOpen = knockout.observable(false);
                layerViewModel.isLoading = knockout.observable(false);

                if (!defined(layerViewModel.Layer)) {
                    var layer;
                    var layerRequested = false;
                    var version = knockout.observable(0);

                    layerViewModel.Layer = knockout.computed(function() {
                        version();

                        if (layerRequested) {
                            return layer;
                        }

                        if (!defined(layer)) {
                            layer = [];
                        }

                        // Don't request capabilities until the layer is opened.
                        if (layerViewModel.isOpen()) {
                            layerViewModel.isLoading(true);
                            that._viewer.geoDataManager.getCapabilities(options.data, function(description) {
                                var remapped = komapping.fromJS(description, that._categoryMapping);

                                layerViewModel.name(remapped.name());

                                var layers = remapped.Layer();
                                for (var i = 0; i < layers.length; ++i) {
                                    // TODO: handle hierarchy better
                                    if (defined(layers[i].Layer)) {
                                        var subLayers = layers[i].Layer();
                                        for (var j = 0; j < subLayers.length; ++j) {
                                            layer.push(subLayers[j]);
                                        }
                                    } else {
                                        layer.push(layers[i]);
                                    }
                                }

                                version(version() + 1);
                                layerViewModel.isLoading(false);
                            });

                            layerRequested = true;
                        }

                        return layer;
                    });
                }

                return layerViewModel;
            }
        }
    };

    var browserContentViewModel = komapping.fromJS([], this._browserContentMapping);
    this.content = browserContentViewModel;

    var dataCollectionsPromise = loadJson('./data_collection.json');
    var otherSourcesPromise = loadJson('./data_sources.json');

    when.all([dataCollectionsPromise, otherSourcesPromise], function(sources) {
        var browserContent = [];
        browserContent.push(sources[0]);

        var otherSources = sources[1].Layer;
        for (var i = 0; i < otherSources.length; ++i) {
            browserContent.push(otherSources[i]);
        }

        komapping.fromJS(browserContent, that._browserContentMapping, browserContentViewModel);
    });

    this.userContent = komapping.fromJS([], this._browserContentMapping);

    function getDescription(item) {
        return item.description;
    }

    var nowViewingMapping = {
        create : function(options) {
            var viewModel = komapping.fromJS(options.data.description);
            viewModel.show = knockout.observable(options.data.show);
            viewModel.model = options.data;
            return viewModel;
        }
    };

    this.nowViewing = komapping.fromJS(this._dataManager.layers, nowViewingMapping);

    this._removeGeoDataAddedListener = this._dataManager.GeoDataAdded.addEventListener(function() {
        komapping.fromJS(that._dataManager.layers, nowViewingMapping, that.nowViewing);
    });

    this._removeGeoDataRemovedListener = this._dataManager.GeoDataRemoved.addEventListener(function() {
        komapping.fromJS(that._dataManager.layers, nowViewingMapping, that.nowViewing);
    });

    function noopHandler(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    function dropHandler(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        function loadCollection(json) {
            if (!defined(json) || !defined(json.name) || !defined(json.Layer)) {
                return;
            }

            var collections;
            if (json.name === 'National Map Services') {
                collections = json.Layer;
            } else {
                collections = [json];
            }

            var existingCollection;

            for (var i = 0; i < collections.length; ++i) {
                var collection = collections[i];

                // Find an existing collection with the same name, if any.
                var name = collection.name;
                var existingCollections = browserContentViewModel();

                existingCollection = undefined;
                for (var j = 0; j < existingCollections.length; ++j) {
                    if (existingCollections[j].name() === name) {
                        existingCollection = existingCollections[j];
                        break;
                    }
                }

                if (defined(existingCollection)) {
                    komapping.fromJS(collection, that._browserContentMapping, existingCollection);
                } else {
                    browserContentViewModel.push(komapping.fromJS(collection, that._browserContentMapping));
                }
            }
        }

        var files = evt.dataTransfer.files;
        for (var i = 0; i < files.length; ++i) {
            var file = files[i];
            if (file.name.indexOf('.json') === -1) {
                continue;
            }

            when(readJson(file), loadCollection);
        }
    }

    document.addEventListener("dragenter", noopHandler, false);
    document.addEventListener("dragexit", noopHandler, false);
    document.addEventListener("dragover", noopHandler, false);
    document.addEventListener("drop", dropHandler, false);
};

defineProperties(GeoDataBrowserViewModel.prototype, {
    toggleShowingPanel : {
        get : function() {
            return this._toggleShowingPanel;
        }
    },

    toggleShowingMapPanel : {
        get : function() {
            return this._toggleShowingMapPanel;
        }
    },

    openItem : {
        get : function() {
            return this._openItem;
        }
    },

    openAddData : {
        get : function() {
            return this._openAddData;
        }
    },

    openNowViewing : {
        get : function() {
            return this._openNowViewing;
        }
    },

    openImagery : {
        get : function() {
            return this._openImagery;
        }
    },

    openViewerSelection : {
        get : function() {
            return this._openViewerSelection;
        }
    },

    toggleCategoryOpen : {
        get : function() {
            return this._toggleCategoryOpen;
        }
    },

    toggleItemEnabled : {
        get : function() {
            return this._toggleItemEnabled;
        }
    },

    toggleItemShown : {
        get : function() {
            return this._toggleItemShown;
        }
    },

    zoomToItem : {
        get : function() {
            return this._zoomToItem;
        }
    },

    showInfoForItem : {
        get : function() {
            return this._showInfoForItem;
        }
    },

    activateBingMapsAerialWithLabels : {
        get : function() {
            return this._activateBingMapsAerialWithLabels;
        }
    },

    activateBingMapsAerial : {
        get : function() {
            return this._activateBingMapsAerial;
        }
    },

    activateBingMapsRoads : {
        get : function() {
            return this._activateBingMapsRoads;
        }
    },

    activateNasaBlackMarble : {
        get : function() {
            return this._activateNasaBlackMarble;
        }
    },

    activateNaturalEarthII : {
        get : function() {
            return this._activateNaturalEarthII;
        }
    },

    activateAustralianTopography : {
        get : function() {
            return this._activateAustralianTopography;
        }
    },

    addWfsService : {
        get : function() {
            return this._addWfsService;
        }
    },

    selectFileToUpload : {
        get : function() {
            return this._selectFileToUpload;
        }
    },

    addUploadedFile : {
        get : function() {
            return this._addUploadedFile;
        }
    }
});

function enableItem(viewModel, item) {
    var description = komapping.toJS(item);
    var layer = new GeoData({
        name: description.Title,
        type: description.type,
        extent: getOGCLayerExtent(description)
    });

    if (defined(description.url)) {
        layer.url = description.url;
    } else if (description.type === 'CKAN') {
        for (var i = 0; i < description.resources.length; i++) {
            if (description.resources[i].format.toUpperCase() === 'JSON') {
                layer.url = description.resources[i].url;
            }
        }
    } else {
        description.count = 1000;
        layer.url = viewModel._dataManager.getOGCFeatureURL(description);
    }

    layer.description = description;

    //pass leaflet map object if exists
    layer.map = viewModel.map;
    layer.proxy = description.proxy;

    item.layer = layer;

    viewModel._dataManager.sendLayerRequest(layer);
}

function disableItem(viewModel, item) {
    var index = viewModel._dataManager.layers.indexOf(item.layer);
    viewModel._dataManager.remove(index);
}

function getOGCLayerExtent(layer) {
    var rect;
    var box;

    if (layer.WGS84BoundingBox) {
        var lc = layer.WGS84BoundingBox.LowerCorner.split(" ");
        var uc = layer.WGS84BoundingBox.UpperCorner.split(" ");
        rect = Rectangle.fromDegrees(parseFloat(lc[0]), parseFloat(lc[1]), parseFloat(uc[0]), parseFloat(uc[1]));
    }
    else if (layer.LatLonBoundingBox) {
        box = layer.LatLonBoundingBox || layer.BoundingBox;
        rect = Rectangle.fromDegrees(parseFloat(box.minx), parseFloat(box.miny),
            parseFloat(box.maxx), parseFloat(box.maxy));
    }
    else if (layer.EX_GeographicBoundingBox) {
        box = layer.EX_GeographicBoundingBox;
        rect = Rectangle.fromDegrees(parseFloat(box.westBoundLongitude), parseFloat(box.southBoundLatitude),
            parseFloat(box.eastBoundLongitude), parseFloat(box.northBoundLatitude));
    }
    else if (layer.BoundingBox) {
        box = layer.BoundingBox;
        rect = Rectangle.fromDegrees(parseFloat(box.west), parseFloat(box.south),
            parseFloat(box.east), parseFloat(box.north));
    }
    return rect;
}

module.exports = GeoDataBrowserViewModel;
