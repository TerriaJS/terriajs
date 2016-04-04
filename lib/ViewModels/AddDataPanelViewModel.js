'use strict';

/*global require*/
var addUserCatalogMember = require('../Models/addUserCatalogMember');
var createCatalogItemFromFileOrUrl = require('../Models/createCatalogItemFromFileOrUrl');
var loadView = require('../Core/loadView');
var TerriaError = require('../Core/TerriaError');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var closeWhenEscapeIsPressed = require('../Core/closeWhenEscapeIsPressed');

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
    closeWhenEscapeIsPressed(this);
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

function noFileApiError(terria) {
    return new TerriaError({
            title: 'File API not supported',
            message: '\
Sorry, your web browser does not support the File API, which '+terria.appName+' requires in order to \
add data from a file on your system.  Please upgrade your web browser.  For the best experience, we recommend \
<a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
        });
}

AddDataPanelViewModel.prototype.selectFileToUpload = function() {
    // If the browser doesn't have the FileReader type, this is an old browser (like IE9) that can't ready a user-selected
    // file from JavaScript without an ugly hack like bouncing it off a server first.  So tell the user this is not supported.
    if (typeof FileReader === 'undefined') {
        this.terria.error.raiseEvent(noFileApiError(this.terria));
        return;
    }

    // We can't add a WMS or WFS server from a file.
    if (this.dataType === 'wms-getCapabilities' || this.dataType === 'wfs-getCapabilities') {
         this.terria.error.raiseEvent(new TerriaError({
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
        this.terria.error.raiseEvent(noFileApiError(this.terria));
        return;
    }

    if (files.length > 0) {
        var promises = [];

        for (var i = 0; i < files.length; ++i) {
            var file = files[i];
            this.terria.analytics.logEvent('uploadFile', 'browse', file.name);

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

AddDataPanelViewModel.prototype.addUrl = function() {
    this.terria.analytics.logEvent('addDataUrl', this.url);

    var that = this;

    addUserCatalogMember(this.terria, createCatalogItemFromFileOrUrl(this.terria, this.url, this.dataType, true)).then(function() {
        that.close();
    });
};

AddDataPanelViewModel.open = function(options) {
    var viewModel = new AddDataPanelViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};

module.exports = AddDataPanelViewModel;
