'use strict';

/*global require*/
var URI = require('URIjs');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');

var loadView = require('../Core/loadView');

var SharePopupViewModel = function(options) {
    this.terria = options.terria;
    this._domNodes = undefined;

    this.imageUrl = '';
    this.url = '';
    this.embedCode = '';
    this.itemsSkippedBecauseTheyHaveLocalData = [];

    knockout.track(this, ['imageUrl', 'url', 'embedCode', 'itemsSkippedBecauseTheyHaveLocalData']);

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

    var uri = new URI(window.location);

    // Remove the portion of the URL after the hash.
    uri.fragment('');

    var requestString = JSON.stringify(request);

    var shortenerUrl = 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyBZIS_uRrKShArQfvQtURFZasUpXyAaGDk';

    var url = uri.toString() + '#start=' + encodeURIComponent(requestString);

//    this.url = uri.toString() + '#start=' + encodeURIComponent(requestString);
//    this.embedCode = '<iframe style="width: 720px; height: 405px; border: none;" src="' + this.url + '" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>';
    this.itemsSkippedBecauseTheyHaveLocalData.push.apply(this.itemsSkippedBecauseTheyHaveLocalData, userDataSerializeOptions.itemsSkippedBecauseTheyHaveLocalData);

    var that = this;
    loadWithXhr({
            url : shortenerUrl,
            method : "POST",
            data : JSON.stringify({"longUrl": url}),
            headers : {'Content-Type': 'application/json'},
            responseType : 'json'
        }).then(function(result) {
            that.url = result.id;
            that.embedCode = '<iframe style="width: 720px; height: 405px; border: none;" src="' + that.url + '" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>';
        }).otherwise(function() {
            console.log('Returned an error while working on url', url);
        });

     this.terria.currentViewer.captureScreenshot().then(function(dataUrl) {
        that.imageUrl = dataUrl;
    });
};

SharePopupViewModel.prototype.show = function(container) {
    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/SharePopup.html', 'utf8'), container, this);
};

SharePopupViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        if (defined(node.parentElement)) {
            node.parentElement.removeChild(node);
        }
    }
};

SharePopupViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background') {
        this.close();
    }
    return true;
};

SharePopupViewModel.open = function(options) {
    var viewModel = new SharePopupViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};

module.exports = SharePopupViewModel;
