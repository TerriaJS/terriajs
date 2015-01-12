'use strict';

/*global require,ga,confirm*/
var createCatalogItemFromUrl = require('./createCatalogItemFromUrl');
var loadView = require('../Core/loadView');
var ViewModelError = require('./ViewModelError');
var WebFeatureServiceGroupViewModel = require('./WebFeatureServiceGroupViewModel');
var WebMapServiceGroupViewModel = require('./WebMapServiceGroupViewModel');

var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var AddDataPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.application)) {
        throw new DeveloperError('options.application is required.');
    }

    this.application = options.application;
    this.destinationGroup = options.destinationGroup;

    this._domNodes = undefined;

    this.webLink = '';

    knockout.track(this, ['webLink']);
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
    var element = document.getElementById('add-data-panel-upload-file');
    element.click();
};

AddDataPanelViewModel.prototype.addUploadedFile = function() {
    var uploadFileElement = document.getElementById('add-data-panel-upload-file');
    var files = uploadFileElement.files;
    for (var i = 0; i < files.length; ++i) {
        var file = files[i];
        ga('send', 'event', 'uploadFile', 'browse', file.name);

        addFile(this, file);
    }

    this.close();
};

AddDataPanelViewModel.prototype.addWebLink = function() {
    ga('send', 'event', 'addDataUrl', this.webLink);

    var that = this;

    // First try to interpret the URL as a WMS.
    var wms = new WebMapServiceGroupViewModel(this.application);
    wms.name = this.webLink;
    wms.url = this.webLink;

    wms.load().then(function() {
        // WMS GetCapabilities was successful, so add this WMS to the catalog.
        that.application.catalog.userAddedDataGroup.items.push(wms);
        wms.isOpen = true;
        that.application.catalog.userAddedDataGroup.isOpen = true;
        that.close();
    }).otherwise(function() {
        // WMS GetCapabilities failed, try WFS
        var wfs = new WebFeatureServiceGroupViewModel(that.application);
        wfs.name = that.webLink;
        wfs.url = that.webLink;

        return wfs.load().then(function() {
            // WFS GetCapabilities was successful, so add this WFS to the catalog.
            that.application.catalog.userAddedDataGroup.items.push(wfs);
            wfs.isOpen = true;
            that.application.catalog.userAddedDataGroup.isOpen = true;

            that.close();
        }).otherwise(function() {
            // WFS GetCapabilities failed too, try treating this as a single data file.
            var dataFile = createCatalogItemFromUrl(that.webLink, that.application);
            if (!defined(dataFile)) {
                throw new ViewModelError({
                    container : document.body,
                    title : 'File format not supported',
                    message : '\
The specified file does not appear to be a format that is supported by National Map.  National Map \
supports Cesium Language (.czml), GeoJSON (.geojson or .json), TopoJSON (.topojson or .json), \
Keyhole Markup Language (.kml or .kmz), GPS Exchange Format (.gpx), and some comma-separated value \
files (.csv).  The file extension of the file in the user-specified URL must match one of \
these extensions in order for National Map to know how to load it.'
                });
            }

            if (dataFile.type === 'ogr' ) {
                    //TODO: popup message with buttons
                if (!confirm('\
This file type is not directly supported by National Map.  However, it may be possible to convert it to a known \
format using the National Map conversion service.  Click OK to upload the file to the National Map conversion service now.  Or, click Cancel \
and the file will not be uploaded or added to the map.')) {
                    return;
                }
            }

            var lastSlashIndex = that.webLink.lastIndexOf('/');

            var name = that.webLink;
            if (lastSlashIndex >= 0) {
                name = name.substring(lastSlashIndex + 1);
            }

            dataFile.name = name;

            var catalog = that.application.catalog;
            catalog.userAddedDataGroup.items.push(dataFile);
            catalog.userAddedDataGroup.isOpen = true;
            dataFile.isEnabled = true;
            dataFile.zoomToAndUseClock();

            that.close();
        });
    });
};

AddDataPanelViewModel.open = function(container, options) {
    var viewModel = new AddDataPanelViewModel(options);
    viewModel.show(container);
    return viewModel;
};

function addFile(viewModel, file) {
    var name = file.newName || file.name;
    var newViewModel = createCatalogItemFromUrl(name, viewModel.application);

    if (!defined(newViewModel)) {
        throw new ViewModelError({
            container : document.body,
            title : 'File format not supported',
            message : '\
The specified file does not appear to be a format that is supported by National Map.  National Map \
supports Cesium Language (.czml), GeoJSON (.geojson or .json), TopoJSON (.topojson or .json), \
Keyhole Markup Language (.kml or .kmz), GPS Exchange Format (.gpx), and some comma-separated value \
files (.csv).  The file extension of the file in the user-specified URL must match one of \
these extensions in order for National Map to know how to load it.'
        });
    }

    if (newViewModel.type === 'ogr' ) {
            //TODO: popup message with buttons
        if (!confirm('\
This file type is not directly supported by National Map.  However, it may be possible to convert it to a known \
format using the National Map conversion service.  Click OK to upload the file to the National Map conversion service now.  Or, click Cancel \
and the file will not be uploaded or added to the map.')) {
            return;
        }
    }

    var lastSlashIndex = name.lastIndexOf('/');
    if (lastSlashIndex >= 0) {
        name = name.substring(lastSlashIndex + 1);
    }

    newViewModel.name = name;
    newViewModel.data = file.json || file;
    newViewModel.dataSourceUrl = file.name;

    var catalog = viewModel.application.catalog;
    catalog.userAddedDataGroup.items.push(newViewModel);
    catalog.userAddedDataGroup.isOpen = true;
    newViewModel.isEnabled = true;
    newViewModel.zoomToAndUseClock();
}

module.exports = AddDataPanelViewModel;
