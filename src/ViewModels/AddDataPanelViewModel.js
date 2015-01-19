'use strict';

/*global require,ga*/
var addUserCatalogMember = require('../Models/addUserCatalogMember');
var createCatalogItemFromFileOrUrl = require('../Models/createCatalogItemFromFileOrUrl');
var loadView = require('../Core/loadView');
var ModelError = require('../Models/ModelError');
var WebFeatureServiceCatalogGroup = require('../Models/WebFeatureServiceCatalogGroup');
var WebMapServiceCatalogGroup = require('../Models/WebMapServiceCatalogGroup');

var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var AddDataPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.application)) {
        throw new DeveloperError('options.application is required.');
    }

    this.application = options.application;
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
        this.application.error.raiseEvent(new ModelError({
            title: 'File API not supported',
            message: '\
Sorry, your web browser does not support the File API, which National Map requires in order to \
add data from a file on your system.  Please upgrade your web browser.  For the best experience, we recommend \
<a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
        }));
        return;
    }

    // We can't add a WMS or WFS server from a file.
    if (this.dataType === 'wms-getCapabilities' || this.dataType === 'wfs-getCapabilities') {
        this.application.error.raiseEvent(new ModelError({
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
        this.application.error.raiseEvent(new ModelError({
            title: 'File API not supported',
            message: '\
Sorry, your web browser does not support the File API, which National Map requires in order to \
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

            promises.push(addUserCatalogMember(this.application, createCatalogItemFromFileOrUrl(this.application, file, this.dataType, true)));
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
        // Does this look like a WFS URL?  If so, try that first (before WMS).
        // This accounts for the fact that a single URL often works as both WMS and WFS.
        if (wfsUrlRegex.test(this.url)) {
            promise = loadWfs(that).otherwise(function() {
                return loadWms(that).otherwise(function() {
                    return loadFile(that);
                });
            });
        } else {
            promise = loadWms(that).otherwise(function() {
                return loadWfs(that).otherwise(function() {
                    return loadFile(that);
                });
            });
        }
    } else if (this.dataType === 'wms-getCapabilities') {
        promise = loadWms(this);
    } else if (this.dataType === 'wfs-getCapabilities') {
        promise = loadWfs(this);
    } else {
        promise = loadFile(this);
    }

    addUserCatalogMember(this.application, promise).then(function() {
        that.close();
    });
};

AddDataPanelViewModel.open = function(container, options) {
    var viewModel = new AddDataPanelViewModel(options);
    viewModel.show(container);
    return viewModel;
};

function loadWms(viewModel) {
    var wms = new WebMapServiceCatalogGroup(viewModel.application);
    wms.name = viewModel.url;
    wms.url = viewModel.url;

    return wms.load().then(function() {
        return wms;
    });
}

function loadWfs(viewModel) {
    var wfs = new WebFeatureServiceCatalogGroup(viewModel.application);
    wfs.name = viewModel.url;
    wfs.url = viewModel.url;

    return wfs.load().then(function() {
        return wfs;
    });
}

function loadFile(viewModel) {
    return createCatalogItemFromFileOrUrl(viewModel.application, viewModel.url, viewModel.dataType, true);
}

module.exports = AddDataPanelViewModel;
