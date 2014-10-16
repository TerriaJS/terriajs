"use strict";

/*global require,ga,alert,L,URI*/

var ArcGisMapServerImageryProvider = require('../../third_party/cesium/Source/Scene/ArcGisMapServerImageryProvider');
var BingMapsApi = require('../../third_party/cesium/Source/Core/BingMapsApi');
var BingMapsImageryProvider = require('../../third_party/cesium/Source/Scene/BingMapsImageryProvider');
var BingMapsStyle = require('../../third_party/cesium/Source/Scene/BingMapsStyle');
var CesiumTerrainProvider = require('../../third_party/cesium/Source/Core/CesiumTerrainProvider');
var combine = require('../../third_party/cesium/Source/Core/combine');
var createCommand = require('../../third_party/cesium/Source/Widgets/createCommand');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var EllipsoidTerrainProvider = require('../../third_party/cesium/Source/Core/EllipsoidTerrainProvider');
var GeographicTilingScheme = require('../../third_party/cesium/Source/Core/GeographicTilingScheme');
var loadImage = require('../../third_party/cesium/Source/Core/loadImage');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadWithXhr = require('../../third_party/cesium/Source/Core/loadWithXhr');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var throttleRequestByServer = require('../../third_party/cesium/Source/Core/throttleRequestByServer');
var TileMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/TileMapServiceImageryProvider');
var when = require('../../third_party/cesium/Source/ThirdParty/when');
var WebMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMercatorTilingScheme = require('../../third_party/cesium/Source/Core/WebMercatorTilingScheme');

var corsProxy = require('../corsProxy');
var GeoData = require('../GeoData');
var GeoDataInfoPopup = require('./GeoDataInfoPopup');
var PopupMessage = require('./PopupMessage');
var readJson = require('../readJson');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var komapping = require('../../public/third_party/knockout.mapping');
var knockoutES5 = require('../../third_party/cesium/Source/ThirdParty/knockout-es5');

var GeoDataBrowserViewModel = function(options) {
    this._viewer = options.viewer;
    this._dataManager = options.dataManager;
    this.map = options.map;
    this.initUrl = options.initUrl;
    this.mode3d = options.mode3d;

    this.showingPanel = false;
    this.showingMapPanel = false;
    this.showingLegendPanel = false;
    this.showingLegendButton = false;
    this.addDataIsOpen = false;
    this.nowViewingIsOpen = true;
    this.wfsServiceUrl = '';
    this.addType = 'Single data file';
    this.topLayerLegendUrl = '';

    this.openMapIndex = 0;
    this.imageryIsOpen = true;
    this.viewerSelectionIsOpen = false;
    this.selectedViewer = this.mode3d ? 'Terrain' : '2D';

    knockout.track(this, ['showingPanel', 'showingMapPanel', 'showingLegendPanel', 'showingLegendButton', 'addDataIsOpen', 'nowViewingIsOpen', 'addType', 'topLayerLegendUrl', 'wfsServiceUrl',
                          'imageryIsOpen', 'viewerSelectionIsOpen', 'selectedViewer']);

    var that = this;

    // Create commands
    this._toggleShowingPanel = createCommand(function() {
        that.showingPanel = !that.showingPanel;
        if (that.showingPanel) {
            that.showingMapPanel = false;
            that.showingLegendPanel = false;
        }
    });

    this._toggleShowingMapPanel = createCommand(function() {
        that.showingMapPanel = !that.showingMapPanel;
        if (that.showingMapPanel) {
            that.showingPanel = false;
            that.showingLegendPanel = false;
        }
    });

    this._toggleShowingLegendPanel = createCommand(function() {
        that.showingLegendPanel = !that.showingLegendPanel;
        if (that.showingLegendPanel) {
            that.showingPanel = false;
            that.showingMapPanel = false;

            // Make sure a legend is visible.
            var nowViewing = that.nowViewing();
            var oneIsOpen = false;
            for (var i = 0; !oneIsOpen && i < nowViewing.length; ++i) {
                if (nowViewing[i].legendIsOpen()) {
                    oneIsOpen = true;
                }
            }

            if (!oneIsOpen && nowViewing.length > 0) {
                nowViewing[i].legendIsOpen(true);
            }
        }
    });

    this._openItem = createCommand(function(item) {
        item.isOpen(!item.isOpen());
    });

    this._openAddData = createCommand(function() {
        that.addDataIsOpen = !that.addDataIsOpen;
    });

    this._openNowViewing = createCommand(function() {
        that.nowViewingIsOpen = !that.nowViewingIsOpen;
    });

    this._openImagery = createCommand(function() {
        that.imageryIsOpen = true;
        that.viewerSelectionIsOpen = false;
    });

    this._openViewerSelection = createCommand(function() {
        that.imageryIsOpen = false;
        that.viewerSelectionIsOpen = true;
    });

    this._openLegend = createCommand(function(item) {
        item.legendIsOpen(!item.legendIsOpen());

        if (item.legendIsOpen()) {
            // Close the other legends.
            var nowViewing = that.nowViewing();
            for (var i = 0; i < nowViewing.length; ++i) {
                if (nowViewing[i] !== item) {
                    nowViewing[i].legendIsOpen(false);
                }
            }
        }
    });

    this._toggleCategoryOpen = createCommand(function(item) {
        item.isOpen(!item.isOpen());
    });

    this._toggleItemEnabled = createCommand(function(item) {
        item.isEnabled(!item.isEnabled());

        if (item.isEnabled()) {
            ga('send', 'event', 'dataSource', 'added', item.Title());
            item._enabledDate = Date.now();
            enableItem(that, item);
        } else {
            var duration;
            if (item._enabledDate) {
                duration = ((Date.now() - item._enabledDate) / 1000.0) | 0;
            }
            ga('send', 'event', 'dataSource', 'removed', item.Title(), duration);
            disableItem(that, item);
        }
    });

    this._toggleItemShown = createCommand(function(item) {
        item.show(!item.show());

        if (item.show()) {
            ga('send', 'event', 'dataSource', 'shown', item.Title());
            item._shownDate = Date.now();
        } else {
            var duration;
            if (item._shownDate) {
                duration = ((Date.now() - item._shownDate) / 1000.0) | 0;
            } else if (item._enabledDate) {
                duration = ((Date.now() - item._enabledDate) / 1000.0) | 0;
            }
            ga('send', 'event', 'dataSource', 'hidden', item.Title(), duration);
        }
        that._dataManager.show(item.layer, item.show());
    });

    this._zoomToItem = createCommand(function(item) {
        if (!defined(item.layer) || !defined(item.layer.extent) || 
            (defined(item.isEnabled) && !item.isEnabled())) {
            return;
        }

        if ((item.layer.extent.east - item.layer.extent.west) > 3.14) {
            console.log('Extent is wider than half the world.  Ignoring zoomto');
            return;
        }

        ga('send', 'event', 'dataSource', 'zoomTo', item.Title());
        item.layer.zoomTo = true;
        that._viewer.setCurrentDataset(item.layer);
        item.layer.zoomTo = false;
    });

    this._showInfoForItem = createCommand(function(item) {
        ga('send', 'event', 'dataSource', 'info', item.Title());
        var popup = new GeoDataInfoPopup({
            container : document.body,
            viewModel : item
        });
    });

    this._addDataOrService = createCommand(function() {
        if (that.addType === 'NotSpecified') {
            var message = new PopupMessage({
                container : document.body,
                title : 'Please select a file or service type',
                message : '\
Please select a file or service type from the drop-down list before clicking the Add button.'
            });
            return;
        } else if (that.addType === 'File') {
            ga('send', 'event', 'addDataUrl', 'File', that.wfsServiceUrl);

            if (that._viewer.geoDataManager.formatSupported(that.wfsServiceUrl)) {
                that._viewer.geoDataManager.loadUrl(that.wfsServiceUrl);
            } else {
                var message2 = new PopupMessage({
                    container : document.body,
                    title : 'File format not supported',
                    message2 : '\
The specified file does not appear to be a format that is supported by National Map.  National Map \
supports Cesium Language (.czml), GeoJSON (.geojson or .json), TopoJSON (.topojson or .json), \
Keyhole Markup Language (.kml or .kmz), GPS Exchange Format (.gpx), and some comma-separated value \
files (.csv).  The file extension of the file in the user-specified URL must match one of \
these extensions in order for National Map to know how to load it.'
                });
            }
        } else {
            ga('send', 'event', 'addDataUrl', that.addType, that.wfsServiceUrl);
            
            var idx = that.wfsServiceUrl.indexOf('?');
            if (idx !== -1) {
                that.wfsServiceUrl = that.wfsServiceUrl.substring(0,idx);
            }
            var item = createCategory({
                data : {
                    name : that.wfsServiceUrl,
                    base_url : that.wfsServiceUrl,
                    type : that.addType
                }
            });
            that.userContent.push(item);

            item.isOpen(true);
        }
        that.wfsServiceUrl = '';
    });

    var currentBaseLayers;

    function removeBaseLayer() {
        if (!defined(that._viewer.viewer)) {
            that._viewer.map.removeLayer(that._viewer.mapBaseLayer);
            return;
        }

        var imageryLayers = that._viewer.scene.globe.imageryLayers;

        if (!defined(currentBaseLayers)) {
            currentBaseLayers = [imageryLayers.get(0)];
        }

        for (var i = 0; i < currentBaseLayers.length; ++i) {
            imageryLayers.remove(currentBaseLayers[i]);
        }

        currentBaseLayers.length = 0;
    }

    function switchToBingMaps(style) {
        removeBaseLayer();

        if (!defined(that._viewer.viewer)) {
            that._viewer.mapBaseLayer = new L.BingLayer(BingMapsApi.getKey(), { type: style });
            that._viewer.map.addLayer(that._viewer.mapBaseLayer);
            return;
        }
        var imageryLayers = that._viewer.scene.globe.imageryLayers;
        currentBaseLayers.push(imageryLayers.addImageryProvider(new BingMapsImageryProvider({
            url : '//dev.virtualearth.net',
            mapStyle : style
        }), 0));
    }

    this._activateBingMapsAerialWithLabels = createCommand(function() {
        ga('send', 'event', 'mapSettings', 'switchImagery', 'Bing Maps Aerial With Labels');
        switchToBingMaps(BingMapsStyle.AERIAL_WITH_LABELS);
    });

    this._activateBingMapsAerial = createCommand(function() {
        ga('send', 'event', 'mapSettings', 'switchImagery', 'Bing Maps Aerial');
        switchToBingMaps(BingMapsStyle.AERIAL);
    });

    this._activateBingMapsRoads = createCommand(function() {
        ga('send', 'event', 'mapSettings', 'switchImagery', 'Bing Maps Roads');
        switchToBingMaps(BingMapsStyle.ROAD);
    });

    this._activateNasaBlackMarble = createCommand(function() {
        ga('send', 'event', 'mapSettings', 'switchImagery', 'NASA Black Marble');

        if (!defined(that._viewer.viewer)) {
            var message = 'This imagery layer is not yet supported in 2D mode.';
            alert(message);
            return;
        }
        
        removeBaseLayer();

        var imageryLayers = that._viewer.scene.globe.imageryLayers;
        currentBaseLayers.push(imageryLayers.addImageryProvider(new TileMapServiceImageryProvider({
            url : '//cesiumjs.org/tilesets/imagery/blackmarble',
            credit : '© Analytical Graphics, Inc.'
        }), 0));
    });

    this._activateNaturalEarthII = createCommand(function() {
        ga('send', 'event', 'mapSettings', 'switchImagery', 'Natural Earth II');

        if (!defined(that._viewer.viewer)) {
            var message = 'This imagery layer is not yet supported in 2D mode.';
            alert(message);
            return;
              //This call works, but since the tiles are in graghic instead of spherical mercator only see western hemisphere
//        this.mapBaseLayer = new L.tileLayer('http://cesiumjs.org/tilesets/imagery/naturalearthii/{z}/{x}/{y}.jpg', 
//        {tms: true});
        }
        
        removeBaseLayer();

        var imageryLayers = that._viewer.scene.globe.imageryLayers;
        currentBaseLayers.push(imageryLayers.addImageryProvider(new TileMapServiceImageryProvider({
            url : '//cesiumjs.org/tilesets/imagery/naturalearthii',
            credit : '© Analytical Graphics, Inc.'
        }), 0));
    });

    this._activateAustralianTopography = createCommand(function() {
        ga('send', 'event', 'mapSettings', 'switchImagery', 'Australian Topography');

        removeBaseLayer();

        if (!defined(that._viewer.viewer)) {
            that._viewer.mapBaseLayer = new L.esri.tiledMapLayer('http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography_2014_WM/MapServer');
            that._viewer.map.addLayer(that._viewer.mapBaseLayer);
            return;
        }

        var imageryLayers = that._viewer.scene.globe.imageryLayers;
        currentBaseLayers.push(imageryLayers.addImageryProvider(new TileMapServiceImageryProvider({
            url : '//cesiumjs.org/tilesets/imagery/naturalearthii',
            credit : '© Analytical Graphics, Inc.'
        }), 0));
        currentBaseLayers.push(imageryLayers.addImageryProvider(new ArcGisMapServerImageryProvider({
            url : 'http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography_2014_WM/MapServer',
            proxy : corsProxy
        }), 1));
    });

    this._activateAustralianHydrography = createCommand(function() {
        ga('send', 'event', 'mapSettings', 'switchImagery', 'Australian Hydrography');

        if (!defined(that._viewer.viewer)) {
            var message = 'This imagery layer is not yet supported in 2D mode.';
            alert(message);
            return;
        }
        
        removeBaseLayer();

        if (!defined(that._viewer.viewer)) {
            that._viewer.mapBaseLayer = new L.esri.tiledMapLayer('http://www.ga.gov.au/gis/rest/services/topography/AusHydro_WM/MapServer');
            that._viewer.map.addLayer(that._viewer.mapBaseLayer);
            return;
        }

        var imageryLayers = that._viewer.scene.globe.imageryLayers;
        currentBaseLayers.push(imageryLayers.addImageryProvider(new TileMapServiceImageryProvider({
            url : '//cesiumjs.org/tilesets/imagery/naturalearthii',
            credit : '© Analytical Graphics, Inc.'
        }), 0));
        currentBaseLayers.push(imageryLayers.addImageryProvider(new ArcGisMapServerImageryProvider({
            url : 'http://www.ga.gov.au/gis/rest/services/topography/AusHydro_WM/MapServer',
            proxy : corsProxy
        }), 1));
    });

    this._selectFileToUpload = createCommand(function() {
        var element = document.getElementById('uploadFile');
        element.click();
    });

    this._addUploadedFile = createCommand(function() {
        var uploadFileElement = document.getElementById('uploadFile');
        var files = uploadFileElement.files;
        for (var i = 0; i < files.length; ++i) {
            var file = files[i];
            ga('send', 'event', 'uploadFile', 'browse', file.name);
            that._viewer.geoDataManager.addFile(file);
            if (file.name.toUpperCase().indexOf('.JSON') !== -1) {
                when(readJson(file), loadCollection);
            }
        }
    });

    function disableAll(items) {
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            if (defined(item.isEnabled)) {
                item.isEnabled(false);
            }

            if (defined(item.Layer)) {
                disableAll(item.Layer());
            }
        }
    }

    this._clearAll = createCommand(function() {
        disableAll(that.content());
        that._viewer.geoDataManager.removeAll();
        return false;
    });

    // Subscribe to a change in the selected viewer (2D/3D) in order to actually switch the viewer.
    knockout.getObservable(this, 'selectedViewer').subscribe(function(value) {
        if (value === '2D') {
            if (that._viewer.isCesium()) {
                ga('send', 'event', 'mapSettings', 'switchViewer', '2D');
                that._viewer.selectViewer(false);
            }
        } else {
            var switched = false;
            if (!that._viewer.isCesium()) {
                that._viewer.selectViewer(true);
                switched = true;
            }

            var terrainProvider = that._viewer.scene.globe.terrainProvider;
            if (value === 'Ellipsoid' && !(terrainProvider instanceof EllipsoidTerrainProvider)) {
                ga('send', 'event', 'mapSettings', 'switchViewer', 'Smooth 3D');
                that._viewer.scene.globe.terrainProvider = new EllipsoidTerrainProvider();
            } else if (value === 'Terrain' && !(terrainProvider instanceof CesiumTerrainProvider)) {
                ga('send', 'event', 'mapSettings', 'switchViewer', '3D');
                that._viewer.scene.globe.terrainProvider = new CesiumTerrainProvider({
                    url : 'http://cesiumjs.org/stk-terrain/tilesets/world/tiles'
                });
            } else if (switched) {
                ga('send', 'event', 'mapSettings', 'switchViewer', '3D');
            }
        }
    });

    function createDataSource(options) {
        var parent = komapping.toJS(options.parent);
        var data = combine(options.data, parent);

        var viewModel = komapping.fromJS(data, that._categoryMapping);
        viewModel.isEnabled = knockout.observable(false);
        return viewModel;
    }

    this._categoryMapping = {
        Layer : {
            create : createDataSource
        }
    };

    function createCategory(options) {
        var viewModel = komapping.fromJS(options.data, that._categoryMapping);

        viewModel.isOpen = knockout.observable(false);
        viewModel.isLoading = knockout.observable(false);

        if (!defined(viewModel.Layer)) {
            var layer;
            var layerRequested = false;
            var version = knockout.observable(0);

            viewModel.Layer = knockout.computed(function() {
                version();

                if (layerRequested) {
                    return layer;
                }

                if (!defined(layer)) {
                    layer = [];
                }

                // Don't request capabilities until the layer is opened.
                if (viewModel.isOpen()) {
                    viewModel.isLoading(true);
                    that._viewer.geoDataManager.getCapabilities(options.data, function(description) {
                        var remapped = createCategory({
                            data: description
                        });

                        viewModel.name(remapped.name());

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
                        viewModel.isLoading(false);
                    });

                    layerRequested = true;
                }

                return layer;
            });
        }

        return viewModel;
    }

    this._collectionMapping = {
        Layer : {
            create : createCategory
        }
    };

    function createCollection(options) {
        var viewModel = komapping.fromJS(options.data, that._collectionMapping);
        viewModel.isOpen = knockout.observable(false);
        return viewModel;
    }

    this._collectionListMapping = {
        create : createCollection
    };

    var browserContentViewModel = komapping.fromJS([], this._collectionListMapping);
    this.content = browserContentViewModel;

    loadJson(this.initUrl).then(loadCollection);

    this.userContent = komapping.fromJS([], this._collectionListMapping);

    var firstNowViewingItem = true;

    var nowViewingMapping = {
        create : function(options) {
            var description = options.data.description;
            if (!defined(description)) {
                var base_url = options.data.url;
                if (defined(base_url)) {
                        //good enough for now.  can be addressed in infobox redo
                    if (defined(options.data.type) && options.data.type === 'DATA') {
                        base_url = '';
                    }
                    else {
                        var idx = base_url.indexOf('?');
                        if (idx !== -1) {
                            base_url = base_url.substring(0,idx);
                        }
                    }
                }
                description = {
                    Title : options.data.name,
                    Name : options.data.name,
                    base_url : base_url,
                    url : options.data.url,
                    type : options.data.type
                };
            }
            var viewModel = komapping.fromJS(description);
            viewModel.show = knockout.observable(options.data.show);
            viewModel.legendIsOpen = knockout.observable(firstNowViewingItem);
            viewModel.layer = options.data;

            firstNowViewingItem = false;

            return viewModel;
        }
    };

    function getLayers() {
        var layers = that._dataManager.layers.slice();
        layers.reverse();
        return layers;
    }

    this.nowViewing = komapping.fromJS(getLayers(), nowViewingMapping);

    function refreshNowViewing() {
        // Get the current scroll height and position
        var panel = document.getElementById('ausglobe-data-panel');
        var previousScrollHeight = panel.scrollHeight;

        firstNowViewingItem = true;
        komapping.fromJS(getLayers(), nowViewingMapping, that.nowViewing);

        // Attempt to maintain the previous scroll position.
        var newScrollHeight = panel.scrollHeight;
        panel.scrollTop += newScrollHeight - previousScrollHeight;

        that.showingLegendButton = false;

        var nowViewing = that.nowViewing();
        if (nowViewing.length > 0) {
            var topLayer = nowViewing[0];

            if (defined(topLayer.legendUrl) && defined(topLayer.legendUrl())) {
                if (topLayer.legendUrl().length > 0) {
                    that.topLayerLegendUrl = topLayer.legendUrl();
                    that.showingLegendButton = true;
                }
            } else if (topLayer.type() === 'WMS') {
                that.topLayerLegendUrl = topLayer.base_url() + '?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&layer=' + topLayer.Name();
                that.showingLegendButton = true;
            }
        }
    }

    this.getLegendUrl = function(item) {
        if (defined(item.legendUrl) && defined(item.legendUrl())) {
            if (item.legendUrl().length > 0) {
                if (corsProxy.shouldUseProxy(item.legendUrl())) {
                    return corsProxy.getURL(item.legendUrl());
                } else {
                    return item.legendUrl();
                }
            }
        } else if (item.type() === 'WMS') {
            var baseUrl = item.base_url();
            if (corsProxy.shouldUseProxy(baseUrl)) {
                baseUrl = corsProxy.getURL(baseUrl);
            }
            return baseUrl + '?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&layer=' + item.Name();
        } else if (defined(item.layer.baseDataSource)) {
            return item.layer.baseDataSource.getLegendGraphic();
        } else if (defined(item.layer.dataSource) && defined(item.layer.dataSource.getLegendGraphic)) {
            return item.layer.dataSource.getLegendGraphic();
        } 

        return '';
    };

    var imageUrlRegex = /[.\/](png|jpg|jpeg|gif)/i;

    this.legendIsImage = function(item) {
        var url = this.getLegendUrl(item);
        if (url.length === 0) {
            return false;
        }

        return url.match(imageUrlRegex);
    };

    this.legendIsLink = function(item) {
        return !this.legendIsImage(item) && this.getLegendUrl(item).length > 0;
    };

    this.legendsExist = function() {
        var nowViewing = that.nowViewing();

        for (var i = 0; i < nowViewing.length; ++i) {
            if (nowViewing[i].show && nowViewing[i].show()) {
                return true;
            }
        }

        return false;
    };

    this.supportsOpacity = function(item) {
        var primitive = item.layer ? item.layer.primitive : undefined;
        return primitive && (defined(primitive.alpha) || defined(primitive.setOpacity));
    };

    this.opacity = function(item) {
        if (!defined(item._opacity)) {
            item._opacity = knockout.observable(100);

            var primitive = item.layer ? item.layer.primitive : undefined;

            if (defined(primitive.alpha)) {
                item._opacity(primitive.alpha * 100.0);
            } else if (defined(primitive.options) && defined(primitive.options.opacity)) {
                item._opacity(primitive.options.opacity * 100.0);
            }

            item._opacity.subscribe(function() {
                if (defined(primitive.alpha)) {
                    primitive.alpha = item._opacity() / 100.0;
                } else if (defined(primitive.setOpacity)) {
                    primitive.setOpacity(item._opacity() / 100.0);
                }
            });
        }

        return item._opacity;
    };

    this._removeGeoDataAddedListener = this._dataManager.GeoDataAdded.addEventListener(refreshNowViewing);
    this._removeGeoDataRemovedListener = this._dataManager.GeoDataRemoved.addEventListener(refreshNowViewing);

    function loadCollection(json) {
        if (!defined(json)) {
            return;
        }

        that._dataManager.addServices(json.NMServices);
        
        var collections = json.Layer;
        
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
                komapping.fromJS(collection, that._collectionListMapping, existingCollection);
            } else {
                existingCollection = komapping.fromJS(collection, that._collectionListMapping);
                browserContentViewModel.push(existingCollection);
            }

            if (collection.type === 'CKAN') {
                loadCkanCollection(collection, existingCollection);
            }
        }
    }

    function loadCkanCollection(collection, existingCollection) {
        // Get the list of groups containing WMS data sources.
        var url = collection.base_url + '/api/3/action/package_search?rows=100000&fq=res_format:wms';

        if (corsProxy.shouldUseProxy(url)) {
            url = corsProxy.getURL(url);
        }

        when(loadJson(url), function(result) {
            var blacklist = that._viewer.geoDataManager.ckanBlacklist;

            var existingGroups = {};

            var items = result.result.results;
            for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
                var groups = items[itemIndex].groups;
                for (var groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
                    var group = groups[groupIndex];
                    if (!existingGroups[group.name]) {
                        if (!blacklist || blacklist.indexOf(group.display_name) < 0) {
                            existingCollection.Layer.push(createCategory({
                                data : {
                                    name: group.display_name,
                                    base_url: collection.base_url + '/api/3/action/package_search?rows=1000&fq=groups:' + group.name + '+res_format:wms',
                                    type: 'CKAN'
                                }
                            }));
                            existingGroups[group.name] = true;
                        }
                    }
                }
            }
        });
    }

    function noopHandler(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    function dropHandler(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files;
        for (var i = 0; i < files.length; ++i) {
            var file = files[i];
            ga('send', 'event', 'uploadFile', 'dragDrop', file.name);
            that._viewer.geoDataManager.addFile(file);
            if (file.name.toUpperCase().indexOf('.JSON') !== -1) {
                when(readJson(file), loadCollection);
            }
        }
    }

    document.addEventListener("dragenter", noopHandler, false);
    document.addEventListener("dragexit", noopHandler, false);
    document.addEventListener("dragover", noopHandler, false);
    document.addEventListener("drop", dropHandler, false);

    var draggedNowViewingItem;
    var dragPlaceholder;

    this._startNowViewingDrag = createCommand(function(viewModel, e) {
        ga('send', 'event', 'dataSource', 'reorder', viewModel.Title());
        draggedNowViewingItem = e.target;

        dragPlaceholder = document.createElement('div');
        dragPlaceholder.className = 'ausglobe-nowViewing-drop-target';
        dragPlaceholder.style.height = draggedNowViewingItem.clientHeight + 'px';
        dragPlaceholder.addEventListener('drop', function(e) {
            var draggedItemIndex = draggedNowViewingItem.getAttribute('nowViewingIndex') | 0;
            var placeholderIndex = dragPlaceholder.getAttribute('nowViewingIndex') | 0;

            while (draggedItemIndex > placeholderIndex) {
                that._dataManager.moveUp(viewModel.layer);
                --draggedItemIndex;
            }
            while (draggedItemIndex < placeholderIndex) {
                that._dataManager.moveDown(viewModel.layer);
                ++draggedItemIndex;
            }
        }, false);

        e.originalEvent.dataTransfer.setData('text', 'Dragging a Now Viewing item.');

        return true;
    });

    this._endNowViewingDrag = createCommand(function(viewModel, e) {
        if (defined(draggedNowViewingItem)) {
            draggedNowViewingItem.style.display = 'block';
        }

        if (defined(dragPlaceholder)) {
            if (defined(dragPlaceholder.parentElement)) {
                dragPlaceholder.parentElement.removeChild(dragPlaceholder);
            }
            dragPlaceholder = undefined;
        }

        refreshNowViewing();

        if (defined(that._viewer.frameChecker)) {
            that._viewer.frameChecker.forceFrameUpdate();
        }
    });

    this._nowViewingDragEnter = createCommand(function(viewModel, e) {
        if (e.currentTarget === dragPlaceholder || !e.currentTarget.parentElement) {
            return;
        }

        e.originalEvent.dataTransfer.dropEffect = 'move';

        draggedNowViewingItem.style.display = 'none';

        // Add the placeholder above the entered element.
        // If the placeholder is already below the entered element, move it above.
        // TODO: this logic is imperfect, but good enough for now.
        var placeholderIndex;
        var targetIndex;

        var siblings = e.currentTarget.parentElement.childNodes;
        for (var i = 0; i < siblings.length; ++i) {
            if (siblings[i] === dragPlaceholder) {
                placeholderIndex = i;
            }
            if (siblings[i] === e.currentTarget) {
                targetIndex = i;
            }
        }

        var insertBefore = true;
        if (placeholderIndex === targetIndex - 1) {
            insertBefore = false;
        }

        if (dragPlaceholder.parentElement) {
            dragPlaceholder.parentElement.removeChild(dragPlaceholder);
        }

        if (insertBefore) {
            e.currentTarget.parentElement.insertBefore(dragPlaceholder, e.currentTarget);
            dragPlaceholder.setAttribute('nowViewingIndex', e.currentTarget.getAttribute('nowViewingIndex'));
        } else {
            e.currentTarget.parentElement.insertBefore(dragPlaceholder, siblings[targetIndex + 1]);
            dragPlaceholder.setAttribute('nowViewingIndex', siblings[targetIndex + 1].getAttribute('nowViewingIndex'));
        }
    });

    handleHash(this);

    window.addEventListener("hashchange", function() {
        handleHash(that);
    }, false);

    function handleHash(viewModel) {
        var uri = new URI(window.location);
        var hash = uri.fragment();

        if (hash.length === 0 || !hashIsSafe(hash)) {
            return;
        }

        // Try loading hash.json.
        loadJson(hash + '.json').then(function(json) {
            if (json.initialCamera) {
                var rectangle = Rectangle.fromDegrees(
                    json.initialCamera.west,
                    json.initialCamera.south,
                    json.initialCamera.east,
                    json.initialCamera.north);
                viewModel._viewer.updateCameraFromRect(rectangle, 3000);
            }

            if (json.initialDataMenu) {
                when(loadJson(json.initialDataMenu), loadCollection);
            }
        });
    }

    function hashIsSafe(hash) {
        var safe = true;
        for (var i = 0; i < hash.length; ++i) {
            safe = safe && (hash[i] >= 'a' && hash[i] <= 'z' ||
                            hash[i] >= 'A' && hash[i] <= 'Z' ||
                            hash[i] >= '0' && hash[i] <= '9');
        }
        return safe;
    }

    this.maxLevel = knockout.observable(5);

    var numWaitingFor;

    this.showPopulateCache = function() {
        var uri = new URI(window.location);
        var hash = uri.fragment();

        if (hash === 'populate-cache') {
            return true;
        }
        return false;
    };

    this.populateCache = function(mode) {
        function waitForAllToFinishLoading() {
            numWaitingFor = 0;
            if (mode !== "all" || (that.content().length > 0 && areAllDoneLoading(that.content()))) {
                var requests = [];

                getAllRequests(mode, requests, that.content());

                console.log('Requesting tiles from ' + requests.length + ' data sources.');

                requestTiles(requests, that.maxLevel());
            } else {
                setTimeout(waitForAllToFinishLoading, 5000);
            }
        }

        waitForAllToFinishLoading();
    };

    function areAllDoneLoading(layers) {
        var allDone = true;

        for (var i = 0; i < layers.length; ++i) {
            var item = layers[i];
            if (item.Layer) {
                if (item.isOpen && !item.isOpen()) {
                    ++numWaitingFor;
                    allDone = false;
                    item.isOpen(true);
                } else if (item.isLoading && item.isLoading()) {
                    ++numWaitingFor;
                    allDone = false;
                }
                allDone = areAllDoneLoading(item.Layer()) && allDone;
            }
        }

        return allDone;
    }

    function getAllRequests(mode, requests, layers) {
        for (var i = 0; i < layers.length; ++i) {
            var item = layers[i];
            if (item.Layer) {
                if (mode !== 'opened' || (item.isOpen && item.isOpen())) {
                    getAllRequests(mode, requests, item.Layer());
                } else if (mode === 'enabled' && item.isEnabled && item.isEnabled()) {
                    getAllRequests(mode, requests, item.Layer());
                }
            } else if (item.type() === 'WMS' && (mode !== 'enabled' || item.isEnabled())) {
                var url = item.base_url();
                var proxy;
                if (corsProxy.shouldUseProxy(url)) {
                    proxy = corsProxy;
                } else {
                    proxy = undefined;
                }

                if (!defined(that._viewer.viewer)) {
                    provider = new L.tileLayer.wms(url, {
                        layers: item.Name(),
                        format: 'image/png',
                        transparent: true,
                        exceptions: 'application/vnd.ogc.se_xml'
                    });
                }
                else {
                    var wmsOptions = {
                        url: url,
                        layers : item.Name(),
                        parameters: {
                            format: 'image/png',
                            transparent: true,
                            styles: '',
                            exceptions: 'application/vnd.ogc.se_xml'
                        },
                        proxy: proxy
                    };

                    var crs;
                    if (defined(item.CRS)) {
                        crs = item.CRS();
                    } else if (defined(item.SRS)) {
                        crs = item.SRS();
                    } else {
                        crs = undefined;
                    }
                    if (defined(crs)) {
                        if (crsIsMatch(crs, 'EPSG:4326')) {
                            // Standard Geographic
                        } else if (crsIsMatch(crs, 'CRS:84')) {
                            // Another name for EPSG:4326
                            wmsOptions.parameters.srs = 'CRS:84';
                        } else if (crsIsMatch(crs, 'EPSG:4283')) {
                            // Australian system that is equivalent to EPSG:4326.
                            wmsOptions.parameters.srs = 'EPSG:4283';
                        } else if (crsIsMatch(crs, 'EPSG:3857')) {
                            // Standard Web Mercator
                            wmsOptions.tilingScheme = new WebMercatorTilingScheme();
                        } else if (crsIsMatch(crs, 'EPSG:900913')) {
                            // Older code for Web Mercator
                            wmsOptions.tilingScheme = new WebMercatorTilingScheme();
                            wmsOptions.parameters.srs = 'EPSG:900913';
                        } else {
                            // No known supported CRS listed.  Try the default, EPSG:4326, and hope for the best.
                        }
                    }

                    var provider = new WebMapServiceImageryProvider(wmsOptions);
                }
                requests.push({
                    item : item,
                    provider : provider
                });
            }
        }
    }

    // From StackOverflow: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    function shuffle(array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    function requestTiles(requests, maxLevel) {
        var urls = [];
        var names = [];

        var name;

        loadImage.createImage = function(url, crossOrigin, deferred) {
            urls.push(url);
            names.push(name);
            deferred.resolve();
        };

        var oldMax = throttleRequestByServer.maximumRequestsPerServer;
        throttleRequestByServer.maximumRequestsPerServer = Number.MAX_VALUE;

        var i;
        for (i = 0; i < requests.length; ++i) {
            var request = requests[i];
            var bareItem = komapping.toJS(request.item);
            var extent = getOGCLayerExtent(bareItem);
//            var tilingScheme = request.provider.tilingScheme;
            var tilingScheme = new WebMercatorTilingScheme();

            name = bareItem.Title;

            for (var level = 0; level <= maxLevel; ++level) {
                var nw = tilingScheme.positionToTileXY(Rectangle.northwest(extent), level);
                var se = tilingScheme.positionToTileXY(Rectangle.southeast(extent), level);
                if (!defined(nw) || !defined(se)) {
                    // Extent is probably junk.
                    continue;
                }

                for (var y = nw.y; y <= se.y; ++y) {
                    for (var x = nw.x; x <= se.x; ++x) {
                        console.log('tile', x, y, level);
//                        if (!defined(request.provider.requestImage(x, y, level))) {
//                            console.log('too many requests in flight');
//                        }
                    }
                }
            }
        }

        return;

        loadImage.createImage = loadImage.defaultCreateImage;
        throttleRequestByServer.maximumRequestsPerServer = oldMax;

        console.log('Requesting ' + urls.length + ' URLs!');

        // Do requests in random order for better performance; successive requests are
        // less likely to be to the same server.
        //shuffle(urls);

        var blacklistFailedServers = false;
        var maxRequests = 2;
        var nextRequestIndex = 0;
        var inFlight = 0;
        var urlsRequested = 0;

        function doneUrl() {
            --inFlight;
            doNext();
        }

        function getNextUrl() {
            var url;
            var baseUrl;

            do {
                if (nextRequestIndex >= urls.length) {
                    return undefined;
                }

                if ((nextRequestIndex % 10) === 0) {
                    console.log('Finished ' + nextRequestIndex + ' URLs.');
                }

                url = urls[nextRequestIndex];
                name = names[nextRequestIndex];
                ++nextRequestIndex;

                var queryIndex = url.indexOf('?');
                baseUrl = url;
                if (queryIndex >= 0) {
                    baseUrl = url.substring(0, queryIndex);
                }

            } while (blacklist[baseUrl]);

            return {
                url: url,
                baseUrl: baseUrl,
                name: name
            };
        }

        var blacklist = {};

        function doNext() {
            var next = getNextUrl();
            if (!defined(next)) {
                if (inFlight === 0) {
                    console.log('Finished ' + nextRequestIndex + ' URLs.  DONE!');
                    console.log('Actual number of URLs requested: ' + urlsRequested);
                }
                return;
            }

            ++urlsRequested;
            ++inFlight;

            loadWithXhr({
                url : next.url
            }).then(doneUrl).otherwise(function() {
                if (blacklistFailedServers) {
                    console.log('Blacklisting ' + next.baseUrl + ' because it returned an error while working on layer ' + next.name);
                    blacklist[next.baseUrl] = true;
                } else {
                    console.log(next.baseUrl + ' returned an error while working on layer ' + next.name);
                }
                doneUrl();
            });
        }

        for (i = 0; i < maxRequests; ++i) {
            doNext();
        }
    }


    function crsIsMatch(crs, matchValue) {
        if (crs === matchValue) {
            return true;
        }

        if (crs instanceof Array && crs.indexOf(matchValue) >= 0) {
            return true;
        }

         return false;
    }
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

    toggleShowingLegendPanel : {
        get : function() {
            return this._toggleShowingLegendPanel;
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

    openLegend : {
        get : function() {
            return this._openLegend;
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

    activateAustralianHydrography : {
        get : function() {
            return this._activateAustralianHydrography;
        }
    },

    addDataOrService : {
        get : function() {
            return this._addDataOrService;
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
    },

    startNowViewingDrag : {
        get : function() {
            return this._startNowViewingDrag;
        }
    },

    nowViewingDragEnter : {
        get : function() {
            return this._nowViewingDragEnter;
        }
    },

    endNowViewingDrag : {
        get : function() {
            return this._endNowViewingDrag;
        }
    },

    clearAll : {
        get : function() {
            return this._clearAll;
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
    } 
    else {
        description.count = 1000;
        layer.url = viewModel._dataManager.getOGCFeatureURL(description);
    }

    layer.description = description;
    layer.style = description.style;

    item.layer = layer;

    var succeed = function(layer) {
        viewModel._dataManager.sendLayerRequest(layer);
    };
    var fail = function(layer) {
        viewModel._dataManager.remove(viewModel._dataManager.layers.indexOf(layer));
        item.isEnabled(false);
    };
    
    //doing this after as a check - could also be done before
    viewModel._dataManager.checkServerHealth(layer, succeed, fail );
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
