"use strict";

/*global require,ga,alert,L*/

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
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var TileMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/TileMapServiceImageryProvider');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

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

    //this.initUrl = options.initUrl;
    this.mode3d = options.mode3d;

    this._draggedNowViewingItem = undefined;
    this._dragPlaceholder = undefined;

    this.showingDataPanel = false;
    this.showingMapPanel = false;
    this.showingLegendPanel = false;
    this.showingLegendButton = false;
    this.addDataIsOpen = false;
    this.wfsServiceUrl = '';
    this.addType = 'Single data file';
    this.topLayerLegendUrl = '';

    this.openMapIndex = 0;
    this.imageryIsOpen = true;
    this.viewerSelectionIsOpen = false;
    this.selectedViewer = this.mode3d ? 'Terrain' : '2D';

    this.catalog = options.catalog;

    this.nowViewing = this.catalog.context.nowViewing;

    knockout.track(this, ['showingDataPanel', 'showingMapPanel', 'showingLegendPanel', 'showingLegendButton', 'addDataIsOpen', 'addType', 'topLayerLegendUrl', 'wfsServiceUrl',
                          'imageryIsOpen', 'viewerSelectionIsOpen', 'selectedViewer']);

    var that = this;

    // Create commands
    this._toggleShowingLegendPanel = createCommand(function() {
        that.showingLegendPanel = !that.showingLegendPanel;
        if (that.showingLegendPanel) {
            that.showingDataPanel = false;
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

    this._openAddData = createCommand(function() {
        that.addDataIsOpen = !that.addDataIsOpen;
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

    this.getLegendUrl = function(item) {
        if (defined(item.legendUrl)) {
            if (item.legendUrl.length > 0) {
                return item.legendUrl;
            }
        } else if (item.type === 'WMS') {
            return item.url + '?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&layer=' + item.layers;
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
        var nowViewing = that.nowViewing.items;

        for (var i = 0; i < nowViewing.length; ++i) {
            if (nowViewing[i].show) {
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

    function loadCkanCollection(collection, existingCollection) {
        // Get the list of groups containing WMS data sources.
        var url = collection.base_url + '/api/3/action/package_search?rows=100000&fq=res_format:wms';

        when(loadJson(url), function(result) {
            var existingGroups = {};

            var items = result.result.results;
            for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
                var groups = items[itemIndex].groups;
                for (var groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
                    var group = groups[groupIndex];
                    if (!existingGroups[group.name]) {
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
};

defineProperties(GeoDataBrowserViewModel.prototype, {
    sceneOrMap : {
        get : function() {
            if (defined(this._viewer.scene)) {
                return this._viewer.scene;
            } else {
                return this._viewer.map;
            }
        }
    },

    openAddData : {
        get : function() {
            return this._openAddData;
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
    }
});

GeoDataBrowserViewModel.prototype.toggleShowingDataPanel = function() {
    this.showingDataPanel = !this.showingDataPanel;
    if (this.showingDataPanel) {
        this.showingMapPanel = false;
        this.showingLegendPanel = false;
    }
};

GeoDataBrowserViewModel.prototype.toggleShowingMapPanel = function() {
    this.showingMapPanel = !this.showingMapPanel;
    if (this.showingMapPanel) {
        this.showingDataPanel = false;
        this.showingLegendPanel = false;
    }
};

GeoDataBrowserViewModel.prototype.toggleShowingLegendPanel = function() {
    this.showingLegendPanel = !this.showingLegendPanel;
    if (this.showingLegendPanel) {
        this.showingDataPanel = false;
        this.showingMapPanel = false;
    }
};

GeoDataBrowserViewModel.prototype.nowViewingDragStart = function(viewModel, e) {
    ga('send', 'event', 'dataSource', 'reorder', viewModel.name);
    
    this._draggedNowViewingItem = e.target;
    this._nowViewingItemDropped = false;

    this._dragPlaceholder = document.createElement('div');
    this._dragPlaceholder.className = 'ausglobe-nowViewing-drop-target';
    this._dragPlaceholder.style.height = this._draggedNowViewingItem.clientHeight + 'px';

    var that = this;
    this._dragPlaceholder.addEventListener('drop', function(e) {
        that._nowViewingItemDropped = true;
    }, false);

    e.originalEvent.dataTransfer.setData('text', 'Dragging a Now Viewing item.');

    return true;
};

GeoDataBrowserViewModel.prototype.nowViewingDragEnd = function(viewModel, e) {
    if (this._nowViewingItemDropped) {
        var draggedItemIndex = this._draggedNowViewingItem.getAttribute('nowViewingIndex') | 0;
        var placeholderIndex = this._dragPlaceholder.getAttribute('nowViewingIndex') | 0;

        while (draggedItemIndex > placeholderIndex) {
            this.nowViewing.raise(viewModel);
            --draggedItemIndex;
        }
        while (draggedItemIndex < placeholderIndex) {
            this.nowViewing.lower(viewModel);
            ++draggedItemIndex;
        }
    }

    if (defined(this._draggedNowViewingItem)) {
        this._draggedNowViewingItem.style.display = 'block';
    }

    if (defined(this._dragPlaceholder)) {
        if (this._dragPlaceholder.parentElement) {
            this._dragPlaceholder.parentElement.removeChild(this._dragPlaceholder);
        }
        this._dragPlaceholder = undefined;
    }

    if (defined(this._viewer.frameChecker)) {
        this._viewer.frameChecker.forceFrameUpdate();
    }
};

GeoDataBrowserViewModel.prototype.nowViewingDragEnter = function(viewModel, e) {
    if (e.currentTarget === this._dragPlaceholder || !e.currentTarget.parentElement) {
        return;
    }

    e.originalEvent.dataTransfer.dropEffect = 'move';

    this._draggedNowViewingItem.style.display = 'none';

    // Add the placeholder above the entered element.
    // If the placeholder is already below the entered element, move it above.
    // TODO: this logic is imperfect, but good enough for now.
    var placeholderIndex;
    var targetIndex;

    var siblings = e.currentTarget.parentElement.childNodes;
    for (var i = 0; i < siblings.length; ++i) {
        if (siblings[i] === this._dragPlaceholder) {
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

    if (this._dragPlaceholder.parentElement) {
        this._dragPlaceholder.parentElement.removeChild(this._dragPlaceholder);
    }

    if (insertBefore) {
        e.currentTarget.parentElement.insertBefore(this._dragPlaceholder, e.currentTarget);
        this._dragPlaceholder.setAttribute('nowViewingIndex', e.currentTarget.getAttribute('nowViewingIndex'));
    } else {
        e.currentTarget.parentElement.insertBefore(this._dragPlaceholder, siblings[targetIndex + 1]);
        this._dragPlaceholder.setAttribute('nowViewingIndex', siblings[targetIndex + 1].getAttribute('nowViewingIndex'));
    }
};

module.exports = GeoDataBrowserViewModel;
