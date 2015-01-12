'use strict';

/*global require*/
var loadView = require('../Core/loadView');

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
}

AddDataPanelViewModel.prototype.addUploadedFile = function() {
    var uploadFileElement = document.getElementById('add-data-panel-upload-file');
    var files = uploadFileElement.files;
    for (var i = 0; i < files.length; ++i) {
        var file = files[i];
        ga('send', 'event', 'uploadFile', 'browse', file.name);

        //addFile(file);
    }
};

AddDataPanelViewModel.prototype.addWebLink = function() {
};

AddDataPanelViewModel.open = function(container, options) {
    var viewModel = new AddDataPanelViewModel(options);
    viewModel.show(container);
    return viewModel;
};

module.exports = AddDataPanelViewModel;
