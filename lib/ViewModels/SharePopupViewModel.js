'use strict';

/*global require*/
var URI = require('urijs');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

var inherit = require('../Core/inherit');
var TerriaError = require('../Core/TerriaError');
var PopupViewModel = require('./PopupViewModel');

/**
 * A dialog that displays a url to the user reflecting the map's current state, and also displays HTML for embedding
 * it as an iframe into another site.
 *
 * @param options {Object}
 * @param options.terria {Terria} the terria instance to get data from
 * @param options.userPropWhiteList {Object} A white list of userProperty ids that will be reflected in the share link.
 *          Defaults to SharePopupViewModel#defaultUserPropWhiteList. Override this if you have custom userProperties
 *          that you want to be shared along with the rest of the map.
 */
var SharePopupViewModel = function(options) {
    PopupViewModel.call(this, options);
    this.terria = options.terria;
    this.userPropWhiteList = defaultValue(options.userPropWhiteList, SharePopupViewModel.defaultUserPropWhiteList);

    this._longUrl = undefined;
    this._shortUrl = undefined;

    this.title = "Share";
    this.url = '';
    this.imageUrl = '';
    this.embedCode = '';
    this.itemsSkippedBecauseTheyHaveLocalData = [];
    this.enableShortenUrl = defined(this.terria.urlShortener) && this.terria.urlShortener.isUsable;

    var shortenLocalProperty = this.terria.getLocalProperty('shortenShareUrls');
    this.shortenUrl = this.enableShortenUrl && (!definedNotNull(shortenLocalProperty) || shortenLocalProperty);

    this.view = require('fs').readFileSync(__dirname + '/../Views/SharePopup.html', 'utf8');

    knockout.track(this, ['imageUrl', 'url', 'embedCode', 'shortenUrl', 'enableShortenUrl', 'itemsSkippedBecauseTheyHaveLocalData']);

    var that = this;

    knockout.getObservable(this, 'shortenUrl').subscribe(function() {
        that.terria.setLocalProperty('shortenShareUrls', that.shortenUrl);
        setShareUrl(that);
    });

    // Build the share URL.
    var request = {
        version: '0.0.05',
        initSources: this.terria.initSources.slice()
    };

    var initSources = request.initSources;

    this._addUserAddedCatalog(initSources);
    this._addSharedMembers(initSources);
    this._addViewSettings(initSources);

    var uri = new URI(window.location);

    // Remove the portion of the URL after the hash.
    uri.fragment('');

    var requestString = JSON.stringify(request);

    this._baseUrl = uri.toString() + '#start=';
    this._shortBaseUrl = uri.toString() + '#share=';

    this._longUrl = this._baseUrl + encodeURIComponent(requestString) + this._generateUserPropertiesQuery();

    setShareUrl(this);

    this.terria.currentViewer.captureScreenshot().then(function(dataUrl) {
        that.imageUrl = dataUrl;
    });
};

inherit(PopupViewModel, SharePopupViewModel);

/**
 * Adds user-added catalog members to the passed initSources.
 * @private
 */
SharePopupViewModel.prototype._addUserAddedCatalog = function(initSources) {
    var localDataFilterRemembering = rememberRejections(localDataFilter);

    var userAddedCatalog = this.terria.catalog.serializeToJson({
        itemFilter: combineFilters([
            localDataFilterRemembering.filter,
            userSuppliedOnlyFilter
        ])
    });
    this.itemsSkippedBecauseTheyHaveLocalData = localDataFilterRemembering.rejections;

    // Add an init source with user-added catalog members.
    if (userAddedCatalog.length > 0) {
        initSources.push({
            catalog: userAddedCatalog
        });
    }
};

/**
 * Adds existing catalog members that the user has enabled or opened to the passed initSources object.
 * @private
 */
SharePopupViewModel.prototype._addSharedMembers = function(initSources) {
    var catalogForSharing = this.terria.catalog.serializeToJson({
        itemFilter: combineFilters([
            enabledFilter,
            localDataFilter,
            populatedGroupsFilter
        ]),
        propertyFilter: sharedPropertyFilter
    });

    if (catalogForSharing.length > 0) {
        initSources.push({
            sharedCatalogMembers: flattenSerializedItems(catalogForSharing)
                .reduce(function(soFar, item) {
                    soFar[item.id] = item;
                    return soFar;
                }, {})
        });
    }
};

/**
 * Adds the details of the current view to the init sources.
 * @private
 */
SharePopupViewModel.prototype._addViewSettings = function(initSources) {
    var cameraExtent = this.terria.currentViewer.getCurrentExtent();

    // Add an init source with the camera position.
    var initialCamera = {
        west: CesiumMath.toDegrees(cameraExtent.west),
        south: CesiumMath.toDegrees(cameraExtent.south),
        east: CesiumMath.toDegrees(cameraExtent.east),
        north: CesiumMath.toDegrees(cameraExtent.north),
    };

    if (defined(this.terria.cesium)) {
        var cesiumCamera = this.terria.cesium.scene.camera;
        initialCamera.position = cesiumCamera.positionWC;
        initialCamera.direction = cesiumCamera.directionWC;
        initialCamera.up = cesiumCamera.upWC;
    }

    var homeCamera = {
        west: CesiumMath.toDegrees(this.terria.homeView.rectangle.west),
        south: CesiumMath.toDegrees(this.terria.homeView.rectangle.south),
        east: CesiumMath.toDegrees(this.terria.homeView.rectangle.east),
        north: CesiumMath.toDegrees(this.terria.homeView.rectangle.north),
        position: this.terria.homeView.position,
        direction: this.terria.homeView.direction,
        up: this.terria.homeView.up
    };

    initSources.push({
        initialCamera: initialCamera,
        homeCamera: homeCamera,
        baseMapName: this.terria.baseMap.name,
        viewerMode: this.terria.leaflet ? '2d': '3d'
    });
};

/**
 * Generates a query string for custom user properties.
 *
 * @returns {String}
 * @private
 */
SharePopupViewModel.prototype._generateUserPropertiesQuery = function() {
    return this.userPropWhiteList.reduce(function(querySoFar, key) {
        var val = this.terria.userProperties[key];
        if (defined(val)) {
            return querySoFar + '&' + key + '=' + encodeURIComponent(val);
        }
        return querySoFar;
    }.bind(this), '');
};

function setShareUrl(viewModel) {
    var iframeString = '<iframe style="width: 720px; height: 405px; border: none;" src="_TARGET_" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>';

    function setUrlAndEmbed(url) {
        viewModel.url = url;
        viewModel.embedCode = iframeString.replace('_TARGET_', viewModel.url);
    }

    if (!viewModel.shortenUrl) {
        setUrlAndEmbed(viewModel._longUrl);
    }
    else if (defined(viewModel._shortUrl)) {
        setUrlAndEmbed(viewModel._shortUrl);
    }
    else {
        viewModel.terria.urlShortener.shorten(viewModel._longUrl).then(function(token) {
            viewModel._shortUrl = viewModel._shortBaseUrl + token;
            setUrlAndEmbed(viewModel._shortUrl);
            viewModel.terria.analytics.logEvent('share', 'url', viewModel._shortUrl);
        }).otherwise(function() {
            viewModel.terria.error.raiseEvent(new TerriaError({
                title: 'Unable to shorten URL',
                message: 'An error occurred while attempting to shorten the URL.  Please check your internet connection and try again.'
            }));
            viewModel.shortenUrl = false;
            setUrlAndEmbed(viewModel._longUrl);
        });
    }
}

SharePopupViewModel.defaultUserPropWhiteList = ['hideExplorerPanel', 'activeTabId'];

SharePopupViewModel.open = function(options) {
    var viewModel = new SharePopupViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};

/**
 * Combines a number of functions that take a single argument and return a boolean into a single function that executes
 * all of them and returns true only if all them do.
 *
 * @param {Array} fns A number of functions to combine into one logical function.
 * @returns {Function} The resulting function.
 */
function combineFilters(fns) {
    return function() {
        var outerArgs = arguments;

        return fns.reduce(function(soFar, fn) {
            return soFar && fn.apply(this, outerArgs);
        }, true);
    };
}

/**
 * Item filter that true if an item has no local data.
 */
function localDataFilter(item) {
    return !defined(item.data);
}

/**
 * Property filter that returns true if the property is in that item's {@link CatalogMember#propertiesForSharing} array.
 */
function sharedPropertyFilter(property, item) {
    return item.propertiesForSharing.indexOf(property) >= 0;
}

/** Item filter that returns true if the item is user supplied */
function userSuppliedOnlyFilter(item) {
    return item.isUserSupplied;
}

/** Item filter that returns true if the item is an enabled {@link CatalogItem} or an open {@link CatalogGroup}. */
function enabledFilter(item) {
    return item.isEnabled || item.isOpen;
}

/** Group filter that returns true if the item is a {@link CatalogGroup} with at least one child item. */
function populatedGroupsFilter(item) {
    return !(defined(item.items) && item.items.length === 0);
}

/**
 * Wraps around a filter function and records all items that are excluded by it. Does not modify the function passed in.
 *
 * @param filterFn The fn to wrap around
 * @returns {{filter: filter, rejections: Array}} The resulting filter function that remembers rejections, and an array
 *          array of the rejected items. As the filter function is used, the rejections array with be populated.
 */
function rememberRejections(filterFn) {
    var rejections = [];

    return {
        filter: function(item) {
            var allowed = filterFn(item);

            if (!allowed) {
                rejections.push(item);
            }

            return allowed;
        },
        rejections: rejections
    };
}

/**
 * Takes the hierarchy of serialized catalog members returned by {@link serializeToJson} and flattens it into an Array.
 * @returns {Array}
 */
function flattenSerializedItems(items) {
    return items.reduce(function (soFar, item) {
        soFar.push(item);

        if (item.items) {
            soFar = soFar.concat(flattenSerializedItems(item.items));
            item.items = undefined;
        }

        return soFar;
    }, []);
}

module.exports = SharePopupViewModel;
