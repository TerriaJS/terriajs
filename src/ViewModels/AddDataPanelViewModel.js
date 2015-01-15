'use strict';

/*global require,ga,confirm*/
var createCatalogItemFromUrl = require('../Models/createCatalogItemFromUrl');
var createCatalogMemberFromType = require('../Models/createCatalogMemberFromType');
var loadView = require('../Core/loadView');
var ViewModelError = require('../Models/ViewModelError');
var WebFeatureServiceGroupViewModel = require('../Models/WebFeatureServiceGroupViewModel');
var WebMapServiceGroupViewModel = require('../Models/WebMapServiceGroupViewModel');

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
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
        node.parentElement.removeChild(node);
    }
};

AddDataPanelViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background') {
        this.close();
    }
    return true;
};

AddDataPanelViewModel.prototype.selectFileToUpload = function() {
    // We can't add a WMS or WFS server from a file.
    if (this.dataType === 'wms-getCapabilities' || this.dataType === 'wfs-getCapabilities') {
        this.application.error.raiseEvent(new ViewModelError({
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

    if (files.length > 0) {
        var promises = [];

        for (var i = 0; i < files.length; ++i) {
            var file = files[i];
            ga('send', 'event', 'uploadFile', 'browse', file.name);

            promises.push(addCatalogItem(this.application, loadFileOrUrl(this.application, file, this.dataType)));
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

    addCatalogItem(this.application, promise).then(function() {
        that.close();
    });
};

AddDataPanelViewModel.open = function(container, options) {
    var viewModel = new AddDataPanelViewModel(options);
    viewModel.show(container);
    return viewModel;
};

function addCatalogItem(application, newCatalogItemPromise) {
    return newCatalogItemPromise.then(function(newCatalogItem) {
        if (!defined(newCatalogItem)) {
            return;
        }

        application.catalog.userAddedDataGroup.items.push(newCatalogItem);

        if (defined(newCatalogItem.isOpen)) {
            newCatalogItem.isOpen = true;
        }

        if (defined(newCatalogItem.isEnabled)) {
            newCatalogItem.isEnabled = true;
        }

        if (defined(newCatalogItem.zoomToAndUseClock)) {
            newCatalogItem.zoomToAndUseClock();
        }

        application.catalog.userAddedDataGroup.isOpen = true;
    }).otherwise(function(e) {
        if (!(e instanceof ViewModelError)) {
            e = new ViewModelError({
                title: 'Data could not be added',
                message: 'The specified data could not be added because it is invalid or does not have the expected format.'
            });
        }

        application.error.raiseEvent(e);

        return when.reject(e);
    });
}

function loadWms(viewModel) {
    var wms = new WebMapServiceGroupViewModel(viewModel.application);
    wms.name = viewModel.url;
    wms.url = viewModel.url;

    return wms.load().then(function() {
        return wms;
    });
}

function loadWfs(viewModel) {
    var wfs = new WebFeatureServiceGroupViewModel(viewModel.application);
    wfs.name = viewModel.url;
    wfs.url = viewModel.url;

    return wfs.load().then(function() {
        return wfs;
    });
}

function loadFile(viewModel) {
    return loadFileOrUrl(viewModel.application, viewModel.url, viewModel.dataType);
}

function loadFileOrUrl(application, fileOrUrl, dataType) {
    var isUrl = typeof fileOrUrl === 'string';
    dataType = defaultValue(dataType, 'auto');

    var name = isUrl ? fileOrUrl : fileOrUrl.name;

    var newCatalogItem;
    if (dataType === 'auto') {
        newCatalogItem = createCatalogItemFromUrl(name, application);

        if (newCatalogItem.type === 'ogr' && !confirm('\
This file type is not directly supported by National Map.  However, it may be possible to convert it to a known \
format using the National Map conversion service.  Click OK to upload the file to the National Map conversion service now.  Or, click Cancel \
and the file will not be uploaded or added to the map.')) {
            return when();
        }

    } else if (dataType === 'other') {
        if (!confirm('\
In order to convert this file to a format supported by National Map, it must be uploaded to the National Map conversion service. \
Click OK to upload the file to the National Map conversion service now.  Or, click Cancel \
and the file will not be uploaded or added to the map.')) {
            return when();
        }

        newCatalogItem = createCatalogMemberFromType('ogr', application);
    } else {
        newCatalogItem = createCatalogMemberFromType(dataType, application);
    }

    var lastSlashIndex = name.lastIndexOf('/');
    if (lastSlashIndex >= 0) {
        name = name.substring(lastSlashIndex + 1);
    }

    newCatalogItem.name = name;

    if (isUrl) {
        newCatalogItem.url = fileOrUrl;
    } else {
        newCatalogItem.data = fileOrUrl;
        newCatalogItem.dataSourceUrl = fileOrUrl.name;
    }

    return newCatalogItem.load().then(function() {
        return newCatalogItem;
    });
}

module.exports = AddDataPanelViewModel;
