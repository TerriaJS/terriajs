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
var createGeoDataItemFromType = require('../ViewModels/createGeoDataItemFromType');
var createGeoDataItemFromUrl = require('../ViewModels/createGeoDataItemFromUrl');
var GeoData = require('../GeoData');
var GeoDataGroupViewModel = require('../ViewModels/GeoDataGroupViewModel');
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
    this.addDataUrl = '';
    this.addType = 'Single data file';
    this.topLayerLegendUrl = '';

    this.openMapIndex = 0;
    this.imageryIsOpen = true;
    this.viewerSelectionIsOpen = false;
    this.selectedViewer = this.mode3d ? 'Terrain' : '2D';

    this.catalog = options.catalog;

    this.nowViewing = this.catalog.context.nowViewing;

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
        var popup = new GeoDataInfoPopup({
            container : document.body,
            dataSource : item
        });
    });

    this._addDataOrService = createCommand(function() {
        var newViewModel;

        if (that.addType === 'NotSpecified') {
            var message = new PopupMessage({
                container : document.body,
                title : 'Please select a file or service type',
                message : '\
Please select a file or service type from the drop-down list before clicking the Add button.'
            });
            return;
        } else if (that.addType === 'File') {
            ga('send', 'event', 'addDataUrl', 'File', that.addDataUrl);

            newViewModel = createGeoDataItemFromUrl(that.addDataUrl, that.catalog.context);
            if (!defined(newViewModel)) {
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

            var lastSlashIndex = that.addDataUrl.lastIndexOf('/');

            var name = that.addDataUrl;
            if (lastSlashIndex >= 0) {
                name = name.substring(lastSlashIndex + 1);
            }

            newViewModel.name = name;

            // TODO: Remove this, it only exists to make the UI happy.
            var group = new GeoDataGroupViewModel(that.catalog.context);
            group.name = name;
            group.isOpen = true;
            group.items.push(newViewModel);

            that.catalog.userAddedDataGroup.items.push(group);
            that.catalog.userAddedDataGroup.isOpen = true;
            newViewModel.isEnabled = true;
        } else {
            ga('send', 'event', 'addDataUrl', that.addType, that.addDataUrl);

            newViewModel = createGeoDataItemFromType(that.addType, that.catalog.context);
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
            var tilingScheme = request.provider.tilingScheme;

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
                        if (!defined(request.provider.requestImage(x, y, level))) {
                            console.log('too many requests in flight');
                        }
                    }
                }
            }
        }

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
