"use strict";

/*global Cesium,require*/

var BingMapsImageryProvider = Cesium.BingMapsImageryProvider;
var BingMapsStyle = Cesium.BingMapsStyle;
var CesiumTerrainProvider = Cesium.CesiumTerrainProvider;
var defined = Cesium.defined;
var defineProperties = Cesium.defineProperties;
var EllipsoidTerrainProvider = Cesium.EllipsoidTerrainProvider;
var TileMapServiceImageryProvider = Cesium.TileMapServiceImageryProvider;
var Rectangle = Cesium.Rectangle;
var createCommand = Cesium.createCommand;

var GeoData = require('../GeoData');
var knockout = require('knockout');
var komapping = require('knockout.mapping');
var knockoutES5 = require('../../public/third_party/knockout-es5.js');

var GeoDataBrowserViewModel = function(options) {
    this.content = options.content;

    this._viewer = options.viewer;
    this._dataManager = options.dataManager;
    this.map = options.map;

    this.showingPanel = false;
    this.showingMapPanel = false;
    this.openIndex = 0;
    this.openMapIndex = 0;

    this.imageryIsOpen = true;
    this.viewerSelectionIsOpen = false;
    this.selectedViewer = 'Terrain';

    var that = this;
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

    this._zoomToItem = createCommand(function(item) {
        if (!defined(item.layer) || !defined(item.layer.extent)) {
            return;
        }
        that._viewer.updateCameraFromRect(item.layer.extent, 1000);
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

    knockout.track(this, ['showingPanel', 'showingMapPanel', 'openIndex', 'imageryIsOpen',
                          'viewerSelectionIsOpen', 'selectedViewer']);

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

    zoomToItem : {
        get : function() {
            return this._zoomToItem;
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
    }
});

function enableItem(viewModel, item) {
    var description = komapping.toJS(item);
    var layer = new GeoData({
        name: description.Name,
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
    if (layer.WGS84BoundingBox) {
        var lc = layer.WGS84BoundingBox.LowerCorner.split(" ");
        var uc = layer.WGS84BoundingBox.UpperCorner.split(" ");
        rect = Rectangle.fromDegrees(parseFloat(lc[0]), parseFloat(lc[1]), parseFloat(uc[0]), parseFloat(uc[1]));
    }
    else if (layer.LatLonBoundingBox) {
        var box = layer.LatLonBoundingBox || layer.BoundingBox;
        rect = Rectangle.fromDegrees(parseFloat(box.minx), parseFloat(box.miny),
            parseFloat(box.maxx), parseFloat(box.maxy));
    }
    else if (layer.EX_GeographicBoundingBox) {
        var box = layer.EX_GeographicBoundingBox;
        rect = Rectangle.fromDegrees(parseFloat(box.westBoundLongitude), parseFloat(box.southBoundLatitude),
            parseFloat(box.eastBoundLongitude), parseFloat(box.northBoundLatitude));
    }
    else if (layer.BoundingBox) {
        var box = layer.BoundingBox;
        rect = Rectangle.fromDegrees(parseFloat(box.west), parseFloat(box.south),
            parseFloat(box.east), parseFloat(box.north));
    }
    return rect;
}

module.exports = GeoDataBrowserViewModel;
