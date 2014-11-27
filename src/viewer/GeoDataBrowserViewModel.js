"use strict";

/*global require,ga,alert,L,confirm*/

var ArcGisMapServerImageryProvider = require('../../third_party/cesium/Source/Scene/ArcGisMapServerImageryProvider');
var BingMapsApi = require('../../third_party/cesium/Source/Core/BingMapsApi');
var BingMapsImageryProvider = require('../../third_party/cesium/Source/Scene/BingMapsImageryProvider');
var BingMapsStyle = require('../../third_party/cesium/Source/Scene/BingMapsStyle');
var createCommand = require('../../third_party/cesium/Source/Widgets/createCommand');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var loadImage = require('../../third_party/cesium/Source/Core/loadImage');
var loadWithXhr = require('../../third_party/cesium/Source/Core/loadWithXhr');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var throttleRequestByServer = require('../../third_party/cesium/Source/Core/throttleRequestByServer');
var TileMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/TileMapServiceImageryProvider');
var WebMercatorTilingScheme = require('../../third_party/cesium/Source/Core/WebMercatorTilingScheme');

var corsProxy = require('../Core/corsProxy');
var createCatalogMemberFromType = require('../ViewModels/createCatalogMemberFromType');
var createCatalogItemFromUrl = require('../ViewModels/createCatalogItemFromUrl');
var CatalogGroupViewModel = require('../ViewModels/CatalogGroupViewModel');
var GeoDataInfoPopup = require('./GeoDataInfoPopup');
var PopupMessage = require('./PopupMessage');
var raiseErrorOnRejectedPromise = require('../ViewModels/raiseErrorOnRejectedPromise');
var readJson = require('../Core/readJson');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var GeoDataBrowserViewModel = function(options) {
    this._viewer = options.viewer;
    this.map = options.map;

    //this.initUrl = options.initUrl;

    this._draggedNowViewingItem = undefined;
    this._dragPlaceholder = undefined;

    this.showingDataPanel = false;
    this.showingMapPanel = false;
    this.showingLegendPanel = false;
    this.showingLegendButton = false;
    this.addDataIsOpen = false;
    this.addDataUrl = '';
    this.addType = 'Single data file';
    this.topLayerLegendUrl = '';

    this.openMapIndex = 0;
    this.imageryIsOpen = true;
    this.viewerSelectionIsOpen = false;

    this.catalog = options.catalog;

    this.nowViewing = this.catalog.application.nowViewing;

    knockout.track(this, ['showingDataPanel', 'showingMapPanel', 'showingLegendPanel', 'showingLegendButton', 'addDataIsOpen', 'addType', 'topLayerLegendUrl', 'addDataUrl',
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
        ga('send', 'event', 'dataSource', 'info', item.name);
        GeoDataInfoPopup.open({
            container : document.body,
            dataSource : item
        });
    });

    this._addDataOrService = createCommand(function() {
        var newViewModel;

        if (that.addType === 'NotSpecified') {
            PopupMessage.open({
                container : document.body,
                title : 'Please select a file or service type',
                message : '\
Please select a file or service type from the drop-down list before clicking the Add button.'
            });
            return;
        } else if (that.addType === 'File') {
            ga('send', 'event', 'addDataUrl', 'File', that.addDataUrl);

            newViewModel = createCatalogItemFromUrl(that.addDataUrl, that.catalog.application);
            if (!defined(newViewModel)) {
                PopupMessage.open({
                    container : document.body,
                    title : 'File format not supported',
                    message : '\
The specified file does not appear to be a format that is supported by National Map.  National Map \
supports Cesium Language (.czml), GeoJSON (.geojson or .json), TopoJSON (.topojson or .json), \
Keyhole Markup Language (.kml or .kmz), GPS Exchange Format (.gpx), and some comma-separated value \
files (.csv).  The file extension of the file in the user-specified URL must match one of \
these extensions in order for National Map to know how to load it.'
                });
                return;
            }

            if (newViewModel.type === 'ogr' ) {
                    //TODO: popup message with buttons
                if (!confirm('\
This file type is not directly supported by National Map.  However, it may be possible to convert it to a known \
format using the National Map conversion service.  Click OK to upload the file to the National Map conversion service now.  Or, click Cancel \
and the file will not be uploaded or added to the map.')) {
                    return;
                }
            }

            var lastSlashIndex = that.addDataUrl.lastIndexOf('/');

            var name = that.addDataUrl;
            if (lastSlashIndex >= 0) {
                name = name.substring(lastSlashIndex + 1);
            }

            newViewModel.name = name;

            // TODO: Remove this, it only exists to make the UI happy.
            var group = new CatalogGroupViewModel(that.catalog.application);
            group.name = name;
            group.isOpen = true;
            group.items.push(newViewModel);

            that.catalog.userAddedDataGroup.items.push(group);
            that.catalog.userAddedDataGroup.isOpen = true;
            newViewModel.isEnabled = true;
            newViewModel.zoomToAndUseClock();
        } else {
            ga('send', 'event', 'addDataUrl', that.addType, that.addDataUrl);

            newViewModel = createCatalogMemberFromType(that.addType, that.catalog.application);
            newViewModel.name = that.addDataUrl;
            newViewModel.url = that.addDataUrl;
            that.catalog.userAddedDataGroup.items.push(newViewModel);

            newViewModel.isOpen = true;
            that.catalog.userAddedDataGroup.isOpen = true;
        }
        that.addDataUrl = '';
    });

    var currentBaseLayers;

    function removeBaseLayer() {
        if (!that._viewer.isCesium()) {
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

        if (!that._viewer.isCesium()) {
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

        if (!that._viewer.isCesium()) {
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

        if (!that._viewer.isCesium()) {
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

        if (!that._viewer.isCesium()) {
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

        if (!that._viewer.isCesium()) {
            var message = 'This imagery layer is not yet supported in 2D mode.';
            alert(message);
            return;
        }
        
        removeBaseLayer();

        if (!that._viewer.isCesium()) {
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

            addFile(file);
        }
    });

    function addFile(file) {
        var name = file.newName || file.name;
        var newViewModel = createCatalogItemFromUrl(name, that.catalog.application);

        if (!defined(newViewModel)) {
            PopupMessage.open({
                container : document.body,
                title : 'File format not supported',
                message : '\
The specified file does not appear to be a format that is supported by National Map.  National Map \
supports Cesium Language (.czml), GeoJSON (.geojson or .json), TopoJSON (.topojson or .json), \
Keyhole Markup Language (.kml or .kmz), GPS Exchange Format (.gpx), and some comma-separated value \
files (.csv).  The file extension of the file in the user-specified URL must match one of \
these extensions in order for National Map to know how to load it.'
            });
            return;
        }

        if (newViewModel.type === 'ogr' ) {
                //TODO: popup message with buttons
            if (!confirm('\
This file type is not directly supported by National Map.  However, it may be possible to convert it to a known \
format using the National Map conversion service.  Click OK to upload the file to the National Map conversion service now.  Or, click Cancel \
and the file will not be uploaded or added to the map.')) {
                return;
            }
        }

        var lastSlashIndex = name.lastIndexOf('/');
        if (lastSlashIndex >= 0) {
            name = name.substring(lastSlashIndex + 1);
        }

        newViewModel.name = name;
        newViewModel.data = file.json || file;
        newViewModel.dataSourceUrl = file.name;

        // TODO: Remove this, it only exists to make the UI happy.
        var group = new CatalogGroupViewModel(that.catalog.application);
        group.name = name;
        group.isOpen = true;
        group.items.push(newViewModel);

        that.catalog.userAddedDataGroup.items.push(group);
        that.catalog.userAddedDataGroup.isOpen = true;
        newViewModel.isEnabled = true;
        newViewModel.zoomToAndUseClock();
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

            if (file.name.toUpperCase().indexOf('.JSON') !== -1) {
                readAndHandleJsonFile(file);
            } else {
                addFile(file);
            }
        }
    }

    function readAndHandleJsonFile(file) {
        raiseErrorOnRejectedPromise(that.catalog.application, readJson(file).then(function(json) {
            var promise;

            if (json.catalog || json.services) {
                if (json.catalog) {
                    promise = that.catalog.updateFromJson(json.catalog, {
                        isUserSupplied: true
                    });
                }

                if (json.services) {
                    that._viewer.application.services.services.push.apply(that._viewer.application.services.services, json.services);
                }
            } else {
                addFile(file);
            }

            return promise;
        }));
    }

    document.addEventListener("dragenter", noopHandler, false);
    document.addEventListener("dragexit", noopHandler, false);
    document.addEventListener("dragover", noopHandler, false);
    document.addEventListener("drop", dropHandler, false);

    this.maxLevel = knockout.observable(5);

    this.showPopulateCache = function() {
        var populateCache = that.catalog.application.getUserProperty('populate-cache');
        if (populateCache && populateCache !== 'false' && populateCache !== 'no' && populateCache !== '0') {
            return true;
        }
        return false;
    };

    this.populateCache = function(mode) {

        var requests = [];

        getAllRequests(mode, requests, that.catalog.group);

        console.log('Requesting tiles from ' + requests.length + ' data sources.');

        requestTiles(requests, that.maxLevel());
    };

    function getAllRequests(mode, requests, group) {
        for (var i = 0; i < group.items.length; ++i) {
            var item = group.items[i];
            if (item instanceof CatalogGroupViewModel) {
                if (item.isOpen) {
                    getAllRequests(mode, requests, item);
                }
            } else if (item.type === 'wms' && (mode === 'opened' || item.isEnabled)) {
                requests.push({
                    item : item
                });
            }
        }
    }

    function requestTiles(requests, maxLevel) {
        var urls = [];
        var names = [];
        var name;

        loadImage.createImage = function(url, crossOrigin, deferred) {
            urls.push(url);
            names.push(name);
            if (defined(deferred)) {
                deferred.resolve();
            }
        };

        var oldMax = throttleRequestByServer.maximumRequestsPerServer;
        throttleRequestByServer.maximumRequestsPerServer = Number.MAX_VALUE;

        var i;
        for (i = 0; i < requests.length; ++i) {
            var request = requests[i];
            var extent = request.item.rectangle;
            name = request.item.name;

            var enabledHere = false;
             if (!request.item.isEnabled) {
                request.item._enable();
                enabledHere = true;
             }

            var tilingScheme;
            if (!that._viewer.isCesium()) {
                request.provider = request.item._imageryLayer;
                tilingScheme = new WebMercatorTilingScheme();
                that._viewer.map.addLayer(request.provider);
            }
            else {
                request.provider = request.item._imageryLayer.imageryProvider;
                tilingScheme = request.provider.tilingScheme;
            }

            for (var level = 0; level <= maxLevel; ++level) {
                var nw = tilingScheme.positionToTileXY(Rectangle.northwest(extent), level);
                var se = tilingScheme.positionToTileXY(Rectangle.southeast(extent), level);
                if (!defined(nw) || !defined(se)) {
                    // Extent is probably junk.
                    continue;
                }

                for (var y = nw.y; y <= se.y; ++y) {
                    for (var x = nw.x; x <= se.x; ++x) {
                        if (!that._viewer.isCesium()) {
                            var coords = new L.Point(x, y);
                            coords.z = level;
                            var url = request.provider.getTileUrl(coords);
                            loadImage.createImage(url);
                        }
                        else {
                            if (!defined(request.provider.requestImage(x, y, level))) {
                                console.log('too many requests in flight');
                            }
                        }
                    }
                }
            }
            if (enabledHere) {
                if (!that._viewer.isCesium()) {
                   that._viewer.map.removeLayer(request.provider);
                }
                request.item._disable();
            }
        }

        loadImage.createImage = loadImage.defaultCreateImage;
        throttleRequestByServer.maximumRequestsPerServer = oldMax;

        console.log('Caching ' + urls.length + ' URLs');

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

            if (nextRequestIndex >= urls.length) {
                return undefined;
            }

            if ((nextRequestIndex % 10) === 0) {
                console.log('Finished ' + nextRequestIndex + ' URLs.');
            }

            url = urls[nextRequestIndex];
            name = names[nextRequestIndex]; //track for error reporting
            ++nextRequestIndex;

            return {
                url: url,
                name: name
            };
        }

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
                console.log('Returned an error while working on layer: ' + next.name);
                doneUrl();
            });
        }

        for (i = 0; i < maxRequests; ++i) {
            doNext();
        }
    }
};

defineProperties(GeoDataBrowserViewModel.prototype, {
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

        // Make sure at least one legend is visible.
        var items = this.nowViewing.items;

        var oneIsVisible = false;
        var firstShown;
        for (var i = 0; !oneIsVisible && i < items.length; ++i) {
            oneIsVisible = items[i].isShown && items[i].isLegendVisible;
            if (!defined(firstShown) && items[i].isShown) {
                firstShown = items[i];
            }
        }

        if (!oneIsVisible && defined(firstShown)) {
            firstShown.isLegendVisible = true;
        }
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
