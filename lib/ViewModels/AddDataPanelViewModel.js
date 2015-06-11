'use strict';

/*global require,ga*/
var OpenStreetMapCatalogItem = require('../Models/OpenStreetMapCatalogItem');
var ArcGisCatalogGroup = require('../Models/ArcGisCatalogGroup');
var addUserCatalogMember = require('../Models/addUserCatalogMember');
var createCatalogItemFromFileOrUrl = require('../Models/createCatalogItemFromFileOrUrl');
var loadView = require('../Core/loadView');
var ModelError = require('../Models/ModelError');
var WebFeatureServiceCatalogGroup = require('../Models/WebFeatureServiceCatalogGroup');
var WebMapServiceCatalogGroup = require('../Models/WebMapServiceCatalogGroup');
var WebMapTileServiceCatalogGroup = require('../Models/WebMapTileServiceCatalogGroup');

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var AddDataPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

     this.terria = options.terria;
    this.destinationGroup = options.destinationGroup;

    this._domNodes = undefined;

    this.url = '';
    this.dataType ='auto';

    knockout.track(this, ['url', 'dataType']);
};

AddDataPanelViewModel.prototype.show = function(container) {
    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/AddDataPanel.html', 'utf8'), container, this);
};

AddDataPanelViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        if (defined(node.parentElement)) {
            node.parentElement.removeChild(node);
        }
    }
};

AddDataPanelViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background') {
        this.close();
    }
    return true;
};

AddDataPanelViewModel.prototype.selectFileToUpload = function() {
    // If the browser doesn't have the FileReader type, this is an old browser (like IE9) that can't ready a user-selected
    // file from JavaScript without an ugly hack like bouncing it off a server first.  So tell the user this is not supported.
    if (typeof FileReader === 'undefined') {
         this.terria.error.raiseEvent(new ModelError({
            title: 'File API not supported',
            message: '\
Sorry, your web browser does not support the File API, which '+this.terria.appName+' requires in order to \
add data from a file on your system.  Please upgrade your web browser.  For the best experience, we recommend \
<a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
        }));
        return;
    }

    // We can't add a WMS or WFS server from a file.
    if (this.dataType === 'wms-getCapabilities' || this.dataType === 'wfs-getCapabilities') {
         this.terria.error.raiseEvent(new ModelError({
            title: 'A service cannot be added from a local file',
            message: 'Sorry, a WMS or WFS server can only be added by providing a URL to the server.  Please select a different type of file, or choose "Auto-detect".'
        }));
        return;
    }

    var element = document.getElementById('add-data-panel-upload-file');
    element.click();
};

AddDataPanelViewModel.prototype.addUploadedFile = function() {
    var uploadFileElement = document.getElementById('add-data-panel-upload-file');
    var files = uploadFileElement.files;

    if (!defined(files)) {
         this.terria.error.raiseEvent(new ModelError({
            title: 'File API not supported',
            message: '\
Sorry, your web browser does not support the File API, which '+this.terria.appName+' requires in order to \
add data from a file on your system.  Please upgrade your web browser.  For the best experience, we recommend \
<a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
        }));
        return;
    }

    if (files.length > 0) {
        var promises = [];

        for (var i = 0; i < files.length; ++i) {
            var file = files[i];
            ga('send', 'event', 'uploadFile', 'browse', file.name);

            promises.push(addUserCatalogMember( this.terria, createCatalogItemFromFileOrUrl( this.terria, file, this.dataType, true)));
        }

        // Attempt to clear the selected file, so the onchange event is fired even if the user selects
        // the same file again.  This may not work in all browsers.
        try { uploadFileElement.value = ''; } catch(e) {}
        try { uploadFileElement.value = null; } catch(e) {}

        var that = this;
        when.all(promises, function() {
            that.close();
        });
    }
};

var wfsUrlRegex = /\bwfs\b/i;

AddDataPanelViewModel.prototype.addUrl = function() {
    ga('send', 'event', 'addDataUrl', this.url);

    var that = this;

    var promise;
    if (this.dataType === 'auto') {
        var wmsThenWfs = [loadWms, loadWfs];
        var wfsThenWms = [loadWfs, loadWms];
        var others = [loadWmts, loadMapServer, loadFile];

        var loadFunctions;

        // Does this look like a WFS URL?  If so, try that first (before WMS).
        // This accounts for the fact that a single URL often works as both WMS and WFS.
        if (wfsUrlRegex.test(this.url)) {
            loadFunctions = wfsThenWms.concat(others);
        } else {
            loadFunctions = wmsThenWfs.concat(others);
        }

        promise = loadAuto(this, loadFunctions);
    } else if (this.dataType === 'wms-getCapabilities') {
        promise = loadWms(this);
    } else if (this.dataType === 'wfs-getCapabilities') {
        promise = loadWfs(this);
    } else if (this.dataType === 'esri-group') {
        promise = loadMapServer(this);
    } else if (this.dataType === 'open-street-map') {
        promise = loadOpenStreetMapServer(this);
    } else {
        promise = loadFile(this);
    }

    addUserCatalogMember( this.terria, promise).then(function() {
        that.close();
    });
};

AddDataPanelViewModel.open = function(options) {
    var viewModel = new AddDataPanelViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};

function loadAuto(viewModel, loadFunctions, index) {
    index = defaultValue(index, 0);
    var loadFunction = loadFunctions[index];

    return loadFunction(viewModel).otherwise(function() {
        return loadAuto(viewModel, loadFunctions, index + 1);
    });
}

function loadWms(viewModel) {
    var wms = new WebMapServiceCatalogGroup(viewModel.terria);
    wms.name = viewModel.url;
    wms.url = viewModel.url;

    return wms.load().then(function() {
        return wms;
    });
}

function loadWfs(viewModel) {
    var wfs = new WebFeatureServiceCatalogGroup(viewModel.terria);
    wfs.name = viewModel.url;
    wfs.url = viewModel.url;

    return wfs.load().then(function() {
        return wfs;
    });
}

function loadWmts(viewModel) {
    var wmts = new WebMapTileServiceCatalogGroup(viewModel.terria);
    wmts.name = viewModel.url;
    wmts.url = viewModel.url;

    return wmts.load().then(function() {
        return wmts;
    });
}

function loadMapServer(viewModel) {
    var mapServer = new ArcGisCatalogGroup(viewModel.terria);
    mapServer.name = viewModel.url;
    mapServer.url = viewModel.url;

    return mapServer.load().then(function() {
        return mapServer;
    });
}

function loadOpenStreetMapServer(viewModel) {
    var openStreetMapServer = new OpenStreetMapCatalogItem(viewModel.terria);
    openStreetMapServer.name = viewModel.url;
    openStreetMapServer.url = viewModel.url;

    return openStreetMapServer.load().then(function() {
        return openStreetMapServer;
    });
}


function loadFile(viewModel) {
    return createCatalogItemFromFileOrUrl(viewModel.terria, viewModel.url, viewModel.dataType, true);
}

module.exports = AddDataPanelViewModel;
