'use strict';

/*global require,ga*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var addUserCatalogMember = require('../Models/addUserCatalogMember');
var createCatalogItemFromFileOrUrl = require('../Models/createCatalogItemFromFileOrUrl');
//var loadView = require('../Core/loadView');
var raiseErrorOnRejectedPromise = require('../Models/raiseErrorOnRejectedPromise');
var readJson = require('../Core/readJson');

var DragDropViewModel = function(options) {
    if (!defined(options) || !defined(options.application)) {
        throw new DeveloperError('options.application is required.');
    }

    this.application = options.application;

    this.dropTarget = undefined;
    if (defined(options.dropTarget)) {
        this.dropTarget = getElement(options.dropTarget);
    } else {
        this.dropTarget = document;
    }

    this.showDropMessage = false;
    this.allowDropDataFiles = defaultValue(options.allowDropDataFiles, true);
    this.allowDropInitFiles = defaultValue(options.allowDropInitFiles, true);

    knockout.track(this, ['showDropMessage', 'allowDropDataFiles', 'allowDropInitFiles']);

    var that = this;

    function noopHandler(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    this.dropTarget.addEventListener("dragenter", noopHandler, false);
    this.dropTarget.addEventListener("dragexit", noopHandler, false);
    this.dropTarget.addEventListener("dragover", noopHandler, false);
    this.dropTarget.addEventListener("drop", function(evt) {
        return dropHandler(that, evt);
    }, false);
};

DragDropViewModel.prototype.show = function(container) {
    //loadView(require('fs').readFileSync(__dirname + '/../Views/DropDrag.html', 'utf8'), container, this);
};

DragDropViewModel.create = function(container, options) {
    var viewModel = new DragDropViewModel(options);
    viewModel.show(container);
    return viewModel;
};

function dropHandler(viewModel, evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files;
    for (var i = 0; i < files.length; ++i) {
        var file = files[i];
        ga('send', 'event', 'uploadFile', 'dragDrop', file.name);

        if (file.name.toUpperCase().indexOf('.JSON') !== -1) {
            readAndHandleJsonFile(viewModel, file);
        } else {
            addFile(viewModel, file);
        }
    }
}

function readAndHandleJsonFile(viewModel, file) {
    raiseErrorOnRejectedPromise(viewModel.application, readJson(file).then(function(json) {
        if (viewModel.allowDropInitFiles && (json.catalog || json.services)) {
            // This is an init file.
            return viewModel.application.addInitSource(json);
        } else {
            // This is some other type of data file.
            return addFile(viewModel, file);
        }
    }));
}

function addFile(viewModel, file) {
    if (!viewModel.allowDropDataFiles) {
        return;
    }

    return addUserCatalogMember(viewModel.application, createCatalogItemFromFileOrUrl(viewModel.application, file, 'auto', true));
}

module.exports = DragDropViewModel;