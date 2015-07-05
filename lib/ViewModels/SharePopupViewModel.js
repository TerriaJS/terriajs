'use strict';

/*global require*/
var URI = require('URIjs');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');

var inherit = require('../Core/inherit');
var PopupViewModel = require('./PopupViewModel');

var SharePopupViewModel = function(options) {
    PopupViewModel.call(this, options);
    this.terria = options.terria;

    this._longUrl = undefined;
    this._shortUrl = undefined;

    this.title = "Share";
    this.url = '';
    this.imageUrl = '';
    this.embedCode = '';
    this.itemsSkippedBecauseTheyHaveLocalData = [];
    this.shortenUrl = false;

    this.view = require('fs').readFileSync(__dirname + '/../Views/SharePopup.html', 'utf8');

    knockout.track(this, ['imageUrl', 'url', 'embedCode', 'shortenUrl', 'itemsSkippedBecauseTheyHaveLocalData']);

    var that = this;

    knockout.getObservable(this, 'shortenUrl').subscribe(function() {
        setShareUrl(that);
    });

    // Build the share URL.
    var cameraExtent =  this.terria.currentViewer.getCurrentExtent();

    var request = {
        version: '0.0.04',
        initSources:  this.terria.initSources.slice()
    };

    var initSources = request.initSources;

    // Add an init source with user-added catalog members.
    var userDataSerializeOptions = {
        userSuppliedOnly: true,
        skipItemsWithLocalData: true,
        itemsSkippedBecauseTheyHaveLocalData: []
    };

    var userAddedCatalog =  this.terria.catalog.serializeToJson(userDataSerializeOptions);
    if (userAddedCatalog.length > 0) {
        initSources.push({
            catalog: userAddedCatalog,
            catalogIsUserSupplied: true
        });
    }

    // Add an init source with the enabled/opened catalog members.
    var enabledAndOpenedCatalog =  this.terria.catalog.serializeToJson({
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

    if (defined( this.terria.cesium)) {
        var cesiumCamera =  this.terria.cesium.scene.camera;
        initialCamera.position = cesiumCamera.positionWC;
        initialCamera.direction = cesiumCamera.directionWC;
        initialCamera.up = cesiumCamera.upWC;
    }

    var homeCamera = {
        west: CesiumMath.toDegrees( this.terria.homeView.rectangle.west),
        south: CesiumMath.toDegrees( this.terria.homeView.rectangle.south),
        east: CesiumMath.toDegrees( this.terria.homeView.rectangle.east),
        north: CesiumMath.toDegrees( this.terria.homeView.rectangle.north),
        position:  this.terria.homeView.position,
        direction:  this.terria.homeView.direction,
        up:  this.terria.homeView.up
    };

    initSources.push({
        initialCamera: initialCamera,
        homeCamera: homeCamera,
        baseMapName: this.terria.baseMap.name,
        viewerMode: this.terria.leaflet ? '2d' : '3d'
    });

    this.itemsSkippedBecauseTheyHaveLocalData.push.apply(this.itemsSkippedBecauseTheyHaveLocalData, userDataSerializeOptions.itemsSkippedBecauseTheyHaveLocalData);

    var uri = new URI(window.location);

    // Remove the portion of the URL after the hash.
    uri.fragment('');

    var requestString = JSON.stringify(request);

    this._longUrl = uri.toString() + '#start=' + encodeURIComponent(requestString);

    setShareUrl(that);

    this.terria.currentViewer.captureScreenshot().then(function(dataUrl) {
        that.imageUrl = dataUrl;
    });
};

inherit(PopupViewModel, SharePopupViewModel);

function setShareUrl(viewModel) {

    var iframeString = '<iframe style="width: 720px; height: 405px; border: none;" src="TARGET" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>';
    var shortenerUrl = 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyBZIS_uRrKShArQfvQtURFZasUpXyAaGDk';

    function setUrlAndEmbed(url) {
        viewModel.url = url;
        viewModel.embedCode = iframeString.replace('TARGET', viewModel.url);
    }

    if (!viewModel.shortenUrl) {
        setUrlAndEmbed(viewModel._longUrl);
    }
    else if (defined(viewModel._shortUrl)) {
        setUrlAndEmbed(viewModel._shortUrl);
    }
    else {
        loadWithXhr({
            url : shortenerUrl,
            method : "POST",
            data : JSON.stringify({"longUrl": viewModel._longUrl}),
            headers : {'Content-Type': 'application/json'},
            responseType : 'json'
        }).then(function(result) {
            viewModel._shortUrl = result.id;
            setUrlAndEmbed(viewModel._shortUrl);
        }).otherwise(function() {
            console.log('Returned an error while working on url', viewModel._longUrl);
            setUrlAndEmbed(viewModel._longUrl);
        });
    }
}

SharePopupViewModel.open = function(options) {
    var viewModel = new SharePopupViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};

module.exports = SharePopupViewModel;