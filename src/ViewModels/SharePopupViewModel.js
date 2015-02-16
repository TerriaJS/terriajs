'use strict';

/*global require,URI*/
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defined = require('../../third_party/cesium/Source/Core/defined');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var SharePopupViewModel = function(options) {
    this.application = options.application;
    this._domNodes = undefined;

    this.imageUrl = '';
    this.url = '';
    this.embedCode = '';
    this.itemsSkippedBecauseTheyHaveLocalData = [];

    knockout.track(this, ['imageUrl', 'url', 'embedCode', 'itemsSkippedBecauseTheyHaveLocalData']);

    // Build the share URL.
    var cameraExtent = this.application.currentViewer.getCurrentExtent();

    var request = {
        version: '0.0.03',
        initSources: this.application.initSources.slice()
    };

    var initSources = request.initSources;

    // Add an init source with user-added catalog members.
    var userDataSerializeOptions = {
        userSuppliedOnly: true,
        skipItemsWithLocalData: true,
        itemsSkippedBecauseTheyHaveLocalData: []
    };

    var userAddedCatalog = this.application.catalog.serializeToJson(userDataSerializeOptions);
    if (userAddedCatalog.length > 0) {
        initSources.push({
            catalog: userAddedCatalog,
            catalogIsUserSupplied: true
        });
    }

    // Add an init source with the enabled/opened catalog members.
    var enabledAndOpenedCatalog = this.application.catalog.serializeToJson({
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
    var camera = {
        west: CesiumMath.toDegrees(cameraExtent.west),
        south: CesiumMath.toDegrees(cameraExtent.south),
        east: CesiumMath.toDegrees(cameraExtent.east),
        north: CesiumMath.toDegrees(cameraExtent.north),
    };

    if (defined(this.application.cesium)) {
        var cesiumCamera = this.application.cesium.scene.camera;
        camera.position = cesiumCamera.positionWC;
        camera.direction = cesiumCamera.directionWC;
        camera.up = cesiumCamera.upWC;
    }

    initSources.push({
        camera: camera
    });

    var uri = new URI(window.location);
    var visServer = uri.protocol() + '://' + uri.host();

    var requestString = JSON.stringify(request);

    this.url = visServer + '#start=' + encodeURIComponent(requestString);
    this.embedCode = '<iframe style="width: 720px; height: 405px; border: none;" src="' + this.url + '" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>';
    this.itemsSkippedBecauseTheyHaveLocalData.push.apply(this.itemsSkippedBecauseTheyHaveLocalData, userDataSerializeOptions.itemsSkippedBecauseTheyHaveLocalData);

    var that = this;
    this.application.currentViewer.captureScreenshot().then(function(dataUrl) {
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

SharePopupViewModel.open = function(container, options) {
    var viewModel = new SharePopupViewModel(options);
    viewModel.show(container);
    return viewModel;
};

module.exports = SharePopupViewModel;
