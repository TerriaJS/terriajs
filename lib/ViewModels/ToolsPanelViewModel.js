'use strict';

/*global require*/
var URI = require('URIjs');

var CatalogGroup = require('../Models/CatalogGroup');
var corsProxy = require('../Core/corsProxy');
var loadView = require('../Core/loadView');
var pollToPromise = require('../Core/pollToPromise');
var PopupMessageViewModel = require('./PopupMessageViewModel');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var getTimestamp = require('terriajs-cesium/Source/Core/getTimestamp');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadImage = require('terriajs-cesium/Source/Core/loadImage');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var throttleRequestByServer = require('terriajs-cesium/Source/Core/throttleRequestByServer');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var ToolsPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

     this.terria = options.terria;

    this._domNodes = undefined;

    this.cacheFilter = 'opened';
    this.minZoomLevel = 5;
    this.maxZoomLevel = 5;
    this.useWmsTileCache = true;
    this.useProxyCache = false;
    this.purgeProxyCache = false;

    this.ckanFilter = 'opened';
    this.ckanUrl = 'http://localhost';
    this.ckanApiKey = 'xxxxxxxxxxxxxxx';

    this.absFilter = 'opened';

    knockout.track(this, ['cacheFilter', 'minZoomLevel', 'maxZoomLevel', 'useWmsTileCache', 'useProxyCache', 'purgeProxyCache', 'ckanFilter', 'ckanUrl', 'ckanApiKey', 'absFilter']);
};

ToolsPanelViewModel.prototype.show = function(container) {
    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/ToolsPanel.html', 'utf8'), container, this);
};

ToolsPanelViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        if (defined(node.parentElement)) {
            node.parentElement.removeChild(node);
        }
    }
};

ToolsPanelViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background') {
        this.close();
    }
    return true;
};

ToolsPanelViewModel.prototype.cacheTiles = function() {
    var requests = [];
    var promises = [];
    getAllRequests(['wms', 'esri-mapServer'], this.cacheFilter, requests,  this.terria.catalog.group, promises);

    var that = this;
    when.all(promises, function() {
        console.log('Requesting tiles in zoom range ' + that.minZoomLevel + '-' + that.maxZoomLevel + ' from ' + requests.length + ' data sources.');
        requestTiles(that, requests, Number(that.minZoomLevel), Number(that.maxZoomLevel));
    });
};

ToolsPanelViewModel.prototype.exportFile = function() {
    //Create the initialization file text
    var catalog =  this.terria.catalog.serializeToJson({serializeForSharing:false});
    var camera = getDegreesRect( this.terria.homeView.rectangle);
    var initJsonObject = { corsDomains: corsProxy.corsDomains, camera: camera, services: [], catalog: catalog};
    var initFile = JSON.stringify(initJsonObject, null, 4);

    //Download it to the browser
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(initFile));
    pom.setAttribute('download', 'data_menu.json');
    pom.click();
};

ToolsPanelViewModel.prototype.exportCkan = function() {
    var requests = [];
    var promises = [];
    getAllRequests(['wms', 'esri-mapServer'], this.ckanFilter, requests,  this.terria.catalog.group, promises);

    var that = this;
    when.all(promises, function() {
        console.log('Exporting metadata from ' + requests.length + ' data sources.');
        populateCkan(requests, that.ckanUrl, that.ckanApiKey);
    });
};

var countValue = 1;

ToolsPanelViewModel.prototype.countDatasets = function() {
    var totals = {
        name: undefined,
        groups: 0,
        items: 0,
        messages: [],
        subTotals: []
    };

    function counter(group, stats, path) {
        stats.name = group.name;

        var promises = [];

        for (var i = 0; i < group.items.length; ++i) {
            var item = group.items[i];
            if (item.countValue === countValue) {
                continue;
            }
            item.countValue = countValue;
            if (typeof item.items !== 'undefined') {
                var childStats = {
                    name: undefined,
                    groups: 0,
                    items: 0,
                    messages: [],
                    subTotals: []
                };

                path.push(item.name);

                var loadPromise = item.load();
                if (defined(loadPromise) && item.isLoading) {
                    promises.push(loadPromise.then(recurseAndUpdateTotals.bind(undefined, item, stats, childStats, path.slice())).otherwise(reportLoadError.bind(undefined, item, stats, path.slice())));
                } else {
                    promises.push(recurseAndUpdateTotals(item, stats, childStats, path));
                }

                path.pop();
            } else {
                ++stats.items;
            }
        }

        return when.all(promises);
    }

    function recurseAndUpdateTotals(item, stats, childStats, path) {
        var promise = counter(item, childStats, path).then(function() {
            stats.groups += childStats.groups + 1;
            stats.items += childStats.items;
            stats.messages.push.apply(stats.messages, childStats.messages);
            stats.subTotals.push(childStats);
        });
        return promise;
    }

    function reportLoadError(item, stats, path) {
        stats.messages.push(path.join(' -> ') + ' failed to load.');
    }

    var popup = PopupMessageViewModel.open('ui', {
        title: 'Dataset Count',
        message: 'Loading and counting, please wait...'
    });

    ++countValue;

    var root = this.terria.catalog.group;
    counter(root, totals, []).then(function() {
        var info = '<div>The catalog contains ' + totals.items + ' items in ' + totals.groups + ' groups.</div>';

        var i;
        var subTotals = totals.subTotals;
        for (i = 0; i < subTotals.length; ++i) {
            info += '<div>' + subTotals[i].name + ': ' + subTotals[i].items + ' items / ' + subTotals[i].groups + ' groups</div>';
        }

        info += '<div>&nbsp;</div>';

        var messages = totals.messages;
        for (i = 0; i < messages.length; ++i) {
            info += '<div>' + messages[i] + '</div>';
        }

        popup.message = info;
    });
};

ToolsPanelViewModel.prototype.cacheAbsData = function() {
    var requests = [];
    var promises = [];
    getAllRequests(['abs-itt'], this.absFilter, requests, this.terria.catalog.group, promises);

    when.all(promises, function() {
        console.log('Caching ABS data for ' + requests.length + ' data sources.');
        requestAbsData(requests);
    });
};

ToolsPanelViewModel.prototype.openAllInOpenGroups = function() {
    function go(group) {
        if (!group.isOpen) {
            return;
        }

        when(group.load(), function() {
            for (var i = 0; i < group.items.length; ++i) {
                var item = group.items[i];
                if (defined(item.items)) {
                    item.isOpen = true;
                    go(item);
                }
            }
        });
    }

    var group = this.terria.catalog.group;
    for (var i = 0; i < group.items.length; ++i) {
        go(group.items[i]);
    }
};

ToolsPanelViewModel.open = function(options) {
    var viewModel = new ToolsPanelViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};


function getAllRequests(types, mode, requests, group, promises, blacklistGroup) {
    function alreadyInRequests(item) {
        for (var i=0; i < requests.length; i++) {
            if (requests[i].item === item) {
                return true;
            }
        }
        return false;
    }
    for (var i = 0; i < group.items.length; ++i) {
        var item = group.items[i];
        if (item instanceof CatalogGroup) {
            if (item.isOpen || mode === 'all' || mode === 'enabled') {
                var currentBlacklistGroup = blacklistGroup;
                if (item.type !== 'group') {
                    currentBlacklistGroup = item.name;
                }
                getAllRequests(types, mode, requests, item, promises, currentBlacklistGroup);
            }
        } else if ((types.indexOf(item.type) !== -1) && (mode !== 'enabled' || item.isEnabled)) {


            if (!alreadyInRequests(item)) {
                var enabledHere = false;
                if (!item.isEnabled) {
                    enabledHere = true;
                    item._enable();
                }
                var imageryProvider;
                if (defined(item._imageryLayer)) {
                    imageryProvider = item._imageryLayer.imageryProvider;
                    promises.push(whenImageryProviderIsReady(imageryProvider));
                }
                requests.push({
                    item : item,
                    blacklistGroup : blacklistGroup,
                    group : group.name,
                    enabledHere : enabledHere,
                    provider : imageryProvider
                });
            }
        }
    }
}

function whenImageryProviderIsReady(imageryProvider) {
    return pollToPromise(function() {
        return imageryProvider.ready;
    }, { timeout: 60000, pollInterval: 100 }).otherwise(function() {
    });
}

function requestTiles(toolsPanel, requests, minLevel, maxLevel) {
    var app = toolsPanel.terria;

    var urls = [];
    var names = [];
    var blacklistGroups = [];
    var stats = [];
    var uniqueStats = [];
    var name;
    var blacklistGroup;
    var stat;
    var maxTilesPerLevel = -1; // only request this number of tiles per zoom level, randomly selected. -1 = no limit.

    loadImage.createImage = function(url, crossOrigin, deferred) {
        urls.push(url);
        names.push(name);
        blacklistGroups.push(blacklistGroup);
        stats.push(stat);
        if (defined(deferred)) {
            deferred.resolve();
        }
    };

    var oldMax = throttleRequestByServer.maximumRequestsPerServer;
    throttleRequestByServer.maximumRequestsPerServer = Number.MAX_VALUE;

    var popup = PopupMessageViewModel.open('ui', {
        title: 'Dataset Testing',
        message: ''
    });

    var i;
    for (i = 0; i < requests.length; ++i) {
        var request = requests[i];

        if (!request.provider.ready) {
            popup.message += '<div>Catalog item ' + request.item.name + ' skipped because it did not get ready in time.</div>';
            continue;
        }

        var extent;
        if (request.provider.rectangle && request.item.rectangle) {
            extent = Rectangle.intersection(request.provider.rectangle, request.item.rectangle);
        } else if (request.provider.rectangle) {
            extent = request.provider.rectangle;
        } else if (request.item.rectangle) {
            extent = request.item.rectangle;
        }

        if (!defined(extent)) {
            extent = app.homeView.rectangle;
        }

        name = request.item.name;
        blacklistGroup = request.blacklistGroup;

        var tilingScheme;
        var leaflet = app.leaflet;
        if (defined(leaflet)) {
            request.provider = request.item._imageryLayer;
            tilingScheme = new WebMercatorTilingScheme();
            leaflet.map.addLayer(request.provider);
        } else {
            tilingScheme = request.provider.tilingScheme;
        }

        stat = {
            name: name,
            success: {
                min: 999999,
                max: 0,
                sum: 0,
                number: 0,
                slow: 0
            },
            error: {
                min: 999999,
                max: 0,
                sum: 0,
                number: 0
            }
        };
        uniqueStats.push(stat);

        for (var level = minLevel; level <= maxLevel; ++level) {
            var nw = tilingScheme.positionToTileXY(Rectangle.northwest(extent), level);
            var se = tilingScheme.positionToTileXY(Rectangle.southeast(extent), level);
            if (!defined(nw) || !defined(se)) {
                // Extent is probably junk.
                popup.message += '<div>Catalog item ' + request.item.name + ' level ' + level + ' skipped because its extent is not valid.</div>';
                continue;
            }
            var potentialTiles = [];
            for (var y = nw.y; y <= se.y; ++y) {
                for (var x = nw.x; x <= se.x; ++x) {
                    potentialTiles.push({"x": x, "y": y, "z": level});
                }
            }
            // randomly select up to maxTilesPerLevel of those tiles
            var t=1;
            while (potentialTiles.length > 0 && (maxTilesPerLevel === -1 || t++ <= maxTilesPerLevel)) {
                var tnum;
                if (maxTilesPerLevel < 0) {
                    // if there's no tile limit, revert to fetching all tiles in order, for predictability.
                    tnum = 0;
                } else {
                    tnum = Math.floor(Math.random() * potentialTiles.length);
                }
                var tile = potentialTiles[tnum];
                if (defined(leaflet)) {
                    loadImage.createImage(request.provider.getTileUrl(tile));
                } else if (!defined(request.provider.requestImage(tile.x, tile.y, tile.z))) {
                    console.log('too many requests in flight');
                }
                potentialTiles.splice(tnum,1);

            }
        }
        if (request.enabledHere) {
            if (defined(leaflet)) {
               leaflet.map.removeLayer(request.provider);
            }
            request.item._disable();
        }
    }

    popup.message += '<div>Requesting ' + urls.length + ' URLs from ' + requests.length + ' data sources, at zooms ' + minLevel + ' to ' + maxLevel + '</div>';

    loadImage.createImage = loadImage.defaultCreateImage;
    throttleRequestByServer.maximumRequestsPerServer = oldMax;

    var maxRequests = 1;
    var nextRequestIndex = 0;
    var inFlight = 0;
    var urlsRequested = 0;
    var showProgress = true;

    function doneUrl(stat, startTime, error) {
        var ellapsed = getTimestamp() - startTime;

        var resultStat;
        if (error) {
            resultStat = stat.error;
        } else {
            resultStat = stat.success;
            if (ellapsed > maxAverage) {
                resultStat.slow ++;
            }
        }

        ++resultStat.number;
        resultStat.sum += ellapsed;

        if (ellapsed > resultStat.max) {
            resultStat.max = ellapsed;
        }
        if (ellapsed < resultStat.min) {
            resultStat.min = ellapsed;
        }

        --inFlight;
        doNext();
    }

    function getNextUrl() {
        var url;
        var stat;

        if (nextRequestIndex >= urls.length) {
            return undefined;
        }

        if (showProgress && nextRequestIndex > 0) {
            popup.message = popup.message.replace(/<div class="tools-loading-message">.*$/gi,
                '<div class="tools-loading-message">Loading: <div class="tools-loading-message-bar" style="width: ' +
                Math.round(nextRequestIndex / urls.length * 100) + '%"></div>');
        }

        url = urls[nextRequestIndex];
        name = names[nextRequestIndex]; //track for error reporting
        stat = stats[nextRequestIndex];
        blacklistGroup = blacklistGroups[nextRequestIndex];
        ++nextRequestIndex;

        return {
            url: url,
            name: name,
            stat: stat,
            blacklistGroup: blacklistGroup
        };
    }

    var last;
    var failedRequests = 0;
    var slowDatasets = 0;
    var totalDatasets = 0;

    var blacklist = {};

    var maxAverage = 400;
    var maxMaximum = 800;

    function doNext() {
        var next = getNextUrl();
        if (defined(last) && (!defined(next) || next.name !== last.name)) {
            var idx = popup.message.indexOf('<div class="tools-loading-message">');
            if (idx !== -1) {
                popup.message = popup.message.substring(0, idx);
            }
            popup.message += '<div>';
            if (last.stat.error.number === 0) {
                popup.message += last.stat.success.number + ' tiles <span style="color:green">✓</span>';
            } else {
                popup.message += last.stat.success.number + last.stat.error.number + ' tiles (<span style="color:red">' + last.stat.error.number + ' failed</span>)';
            }
            if (last.stat.success.slow > 0) {
                popup.message += ' (' + last.stat.success.slow + ' slow) ';
            }
            var average = Math.round(last.stat.success.sum / last.stat.success.number);
            popup.message += ' <span ' + (average > maxAverage ? 'style="color: red"' : '') + '>' +
              'Average: ' + average + 'ms</span>&nbsp;';
            popup.message += '(<span ' + (last.stat.success.max > maxMaximum ? 'style="color: red"' : '') + '>' +
              'Max: ' + Math.round(last.stat.success.max) + 'ms</span>)';
            popup.message += '</div>';

            failedRequests += last.stat.error.number;

            if (average > maxAverage || last.stat.success.max > maxMaximum) {
                ++slowDatasets;
            }
            totalDatasets++;
        }

        if (defined(next) && (!defined(last) || last.name !== next.name) ) {
            popup.message += '<h1>' + next.name + '</h1>' + (showProgress ? '<div class="tools-loading-message">Loading:</div' : '');
        }

        last = next;

        if (!defined(next)) {
            if (inFlight === 0) {
                popup.message += '<h1>Summary</h1>';
                popup.message += '<div>Finished ' + nextRequestIndex + ' URLs for ' + totalDatasets + ' datasets.</div>';
                popup.message += '<div>Actual number of URLs requested: ' + urlsRequested + '</div>';
                popup.message += '<div style="' + (failedRequests > 0 ? 'color:red' : '') + '">Failed tile requests: ' + failedRequests + '</div>';
                popup.message += '<div style="' + (slowDatasets > 0 ? 'color:red' : '') + '">Slow datasets: ' + slowDatasets +
                ' <i>(>' + maxAverage + 'ms average, or >' + maxMaximum + 'ms maximum)</i></div>';

                var blacklistString = JSON.stringify(blacklist);
                if (blacklistString.length > 2) {
                    popup.message += 'Suggested blacklist: <pre>' + JSON.stringify(blacklist) + '</pre>';
                }
            }
        }

        var elPopup = document.getElementById('popup-window-content');
        if (elPopup !== null) {
            elPopup.scrollTop = elPopup.scrollHeight - elPopup.offsetHeight;
        }

        if (elPopup === null || !defined(next)) {
            return;
        }

        ++urlsRequested;
        ++inFlight;

        ++next.stat.number;

        var url = next.url;

        if (!toolsPanel.useProxyCache) {
            url = url.replace('proxy/h', 'proxy/_0d/h');
        }

        if (!toolsPanel.useWmsTileCache) {
            url = url.replace('tiled=true&', '');
        }

        var method = toolsPanel.purgeProxyCache ? 'PURGE' : 'GET';


        var start = getTimestamp();
        loadWithXhr({
            method: method,
            url : url,
            timeout : 2000
        }).then(function() {
            doneUrl(next.stat, start, false);
        }).otherwise(function(e) {
            if (e && e.isTimeout) {
                var blacklistGroup = blacklist[next.blacklistGroup];
                if (!defined(blacklistGroup)) {
                    blacklistGroup = blacklist[next.blacklistGroup] = {};
                }
                blacklistGroup[next.name] = true;
                popup.message += '<div><a href="' + next.url + '">Tile request</a> timed out (2 seconds).</div>';
            } else {
                popup.message += '<div><a href="' + next.url + '">Tile request</a> returned error' + (e.statusCode ? (' (code ' + e.statusCode + ')') : '') + '</div>';
            }
            doneUrl(next.stat, start, true);
        });
    }

    for (i = 0; i < maxRequests; ++i) {
        doNext();
    }
}


function postToCkan(url, dataObj, func, apiKey) {
    return loadWithXhr({
        url : url,
        method : "POST",
        data : JSON.stringify(dataObj),
        headers : {'Authorization' : apiKey},
        responseType : 'json'
    }).then(function(result) {
        func(result);
    }).otherwise(function() {
        console.log('Returned an error while working on url', url);
    });
}

function getCkanName(name) {
    var ckanName = name.toLowerCase().replace(/\W/g,'-');
    return ckanName;
}

function getCkanRect(rect) {
    return CesiumMath.toDegrees(rect.west).toFixed(4) + ',' +
        CesiumMath.toDegrees(rect.south).toFixed(4) + ',' +
        CesiumMath.toDegrees(rect.east).toFixed(4) + ',' +
        CesiumMath.toDegrees(rect.north).toFixed(4);
}

function getDegreesRect(rect) {
    return { west: CesiumMath.toDegrees(rect.west),
        south: CesiumMath.toDegrees(rect.south),
        east: CesiumMath.toDegrees(rect.east),
        north: CesiumMath.toDegrees(rect.north)};
}

function cleanUrl(url) {
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function populateCkan(requests, server, apiKey) {

    var groups = [];
    var orgs = [];
    var orgsCkan = [];
    var groupsCkan = [];
    var packagesCkan = [];

    var ckanServer = server; //get from entry field in ui (maxLevels)
    var ckanApiKey = apiKey; //get from url - #populate-cache=xxxxxxxxx

    for (var i = 0; i < requests.length; ++i) {
        var gname = getCkanName(requests[i].group);
        if (groups[gname] === undefined) {
            groups[gname] = { title: requests[i].group };
        }
        var orgTitle = requests[i].item.dataCustodian;
        var links = orgTitle.match(/[^[\]]+(?=])/g);
        if (links.length > 0) {
            orgTitle = links[0];  //use first link text as title
        }
        requests[i].owner_org = orgTitle;
        var oname = getCkanName(orgTitle);
        if (orgs[oname] === undefined) {
            orgs[oname] = { title: orgTitle, description: requests[i].item.dataCustodian };
        }
    }

    var promises = [];
    promises[0] = postToCkan(
        ckanServer + '/api/3/action/organization_list',
        {},
        function(results) { orgsCkan = results.result; },
        ckanApiKey
    );
    promises[1] = postToCkan(
        ckanServer + '/api/3/action/group_list',
        {},
        function(results) { groupsCkan = results.result; },
        ckanApiKey
    );
    promises[2] = postToCkan(
        ckanServer + '/api/3/action/package_list',
        {},
        function(results) { packagesCkan = results.result; },
        ckanApiKey
    );

    when.all(promises).then(function() {
        var ckanRequests = [], ckanName, i, j, found;
        for (ckanName in groups) {
            if (groups.hasOwnProperty(ckanName)) {
                found = false;
                for (j = 0; j < groupsCkan.length; j++) {
                    if (ckanName === groupsCkan[j]) {
                        found = true;
                        break;
                    }
                }
                ckanRequests.push( {
                    "url": ckanServer + '/api/3/action/group_' + (found ? 'update' : 'create'),
                    "data" : {"name": ckanName, "title": groups[ckanName].title, "id": (found ? ckanName : '')}
                });
            }
        }
        for (ckanName in orgs) {
            if (orgs.hasOwnProperty(ckanName)) {
                found = false;
                for (j = 0; j < orgsCkan.length; j++) {
                    if (ckanName === orgsCkan[j]) {
                        found = true;
                        break;
                    }
                }
                ckanRequests.push({
                    "url": ckanServer + '/api/3/action/organization_' + (found ? 'update' : 'create'),
                    "data" : {"name": ckanName, "title": orgs[ckanName].title,
                            "description": orgs[ckanName].description, "id": (found ? ckanName : '')}
                });
            }
        }
        for (i = 0; i < requests.length; i++) {
            found = false;
            for (j = 0; j < packagesCkan.length; j++) {
                if (getCkanName(requests[i].item.name) === packagesCkan[j]) {
                    found = true;
                    break;
                }
            }
            var bboxString = getCkanRect(requests[i].item.rectangle);
            var extrasList = [ { "key": "geo_coverage", "value":  bboxString} ];
            if (defined(requests[i].item.dataUrlType) && requests[i].item.dataUrlType !== 'wfs') {
                extrasList.push({ "key": "data_url_type", "value":  requests[i].item.dataUrlType});
            }
            if (defined(requests[i].item.dataUrl)) {
                var dataUrl = "";
                if (requests[i].item.dataUrlType === 'wfs') {
                    var baseUrl = cleanUrl(requests[i].item.dataUrl);
                    if ((baseUrl !== requests[i].item.url)) {
                        dataUrl = baseUrl;
                    }
                } else if (requests[i].item.dataUrlType !== 'none') {
                    dataUrl = requests[i].item.dataUrl;
                }
                if (dataUrl !== "") {
                    extrasList.push({ "key": "data_url", "value":  dataUrl});
                }
            }
            var resource;
            if (requests[i].item.type === 'wms') {
                var wmsString = "?service=WMS&version=1.1.1&request=GetMap&width=256&height=256&format=image/png";
                resource = {
                    "wms_layer": requests[i].item.layers,
                    "wms_api_url": requests[i].item.url,
                    "url": requests[i].item.url+wmsString+'&layers='+requests[i].item.layers+'&bbox='+bboxString,
                    "format": "WMS",
                    "name": "WMS link",
                };
            } else if (requests[i].item.type === 'esri-mapService') {
                resource = {
                    "url": requests[i].item.url,
                    "format": "Esri REST",
                    "name": "ESRI REST link"
                };
            }
            ckanRequests.push({
                "url": ckanServer + '/api/3/action/package_' + (found ? 'update' : 'create'),
                "data" : {
                    "name": getCkanName(requests[i].item.name),
                    "title": requests[i].item.name,
                    "license_id": "cc-by",
                    "notes": requests[i].item.description,
                    "owner_org": getCkanName(requests[i].owner_org),
                    "groups": [ { "name": getCkanName(requests[i].group) } ],
                    "extras": extrasList,
                    "resources": [ resource ]
                }
            });
        }

        var currentIndex = 0;
        console.log('Starting ckan tasks:', ckanRequests.length);
        var sendNext = function() {
            if (currentIndex < ckanRequests.length) {
                postToCkan(
                    ckanRequests[currentIndex].url,
                    ckanRequests[currentIndex].data,
                    function() {
                        currentIndex++;
                        if ((currentIndex % 5) === 0 || currentIndex === ckanRequests.length) {
                            console.log('Completed', currentIndex, 'ckan tasks out of', ckanRequests.length);
                        }
                        sendNext();
                    },
                    ckanApiKey
                );
            }
        };
        sendNext();
    });
}

function requestAbsData(requests) {

    var popup = PopupMessageViewModel.open('ui', {
        title: 'ABS Data Caching',
        message: '<h1>Caching ABS responses for ' + requests.length + ' datasets</h1>'
    });

    var sendNext = function(currentIndex) {

        var elPopup = document.getElementById('popup-window-content');

        if (elPopup === null || currentIndex >= requests.length) {
            popup.message += '<h1>Completed ' + currentIndex + ' ABS datasets</h1>';
            return;
        }

        popup.message += '<h2>Caching ' + requests[currentIndex].item.name + '</h2>';
        if (elPopup !== null) {
            elPopup.scrollTop = elPopup.scrollHeight - elPopup.offsetHeight;
        } 

        when(requests[currentIndex].item._cache()).then(function(){
            sendNext(currentIndex+1);
        });
    };
    sendNext(0);
}
module.exports = ToolsPanelViewModel;
