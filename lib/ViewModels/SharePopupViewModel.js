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
    var cameraExtent = this.terria.currentViewer.getCurrentExtent();

    var request = {
        version: '0.0.05',
        initSources: this.terria.initSources.slice()
    };

    var initSources = request.initSources;

    // Add an init source with user-added catalog members.
    var userDataSerializeOptions = {
        userSuppliedOnly: true,
        skipItemsWithLocalData: true,
        itemsSkippedBecauseTheyHaveLocalData: []
    };

    var userAddedCatalog = this.terria.catalog.serializeToJson(userDataSerializeOptions);
    if (userAddedCatalog.length > 0) {
        initSources.push({
            catalog: userAddedCatalog,
            catalogIsUserSupplied: true
        });
    }

    // Add an init source with the enabled/opened catalog members.
    var enabledAndOpenedCatalog = this.terria.catalog.serializeToJson({
        enabledItemsOnly: true,
        skipItemsWithLocalData: true,
        serializeForSharing: true,
    });

    if (enabledAndOpenedCatalog.length > 0) {
        initSources.push({
            catalog: enabledAndOpenedCatalog,
            catalogOnlyUpdatesExistingItems: true
        });
    }

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

    // Add user properties if applicable
    var userPropertiesQuery = '';
    this.userPropWhiteList.map(function(key) {
        var val = this.terria.userProperties[key];
        if (defined(val)) {
            userPropertiesQuery += '&' + key + '=' + encodeURIComponent(val);
        }
    }, this);

    this.itemsSkippedBecauseTheyHaveLocalData.push.apply(this.itemsSkippedBecauseTheyHaveLocalData, userDataSerializeOptions.itemsSkippedBecauseTheyHaveLocalData);

    var uri = new URI(window.location);

    // Remove the portion of the URL after the hash.
    uri.fragment('');

    var requestString = JSON.stringify(request);

    this._baseUrl = uri.toString() + '#start=';
    this._shortBaseUrl = uri.toString() + '#share=';

    this._longUrl = this._baseUrl + encodeURIComponent(requestString) + userPropertiesQuery;

    setShareUrl(that);

    this.terria.currentViewer.captureScreenshot().then(function(dataUrl) {
        that.imageUrl = dataUrl;
    });
};

inherit(PopupViewModel, SharePopupViewModel);

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

module.exports = SharePopupViewModel;
