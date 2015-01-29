'use strict';

/*global require,ga*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var addUserCatalogMember = require('../Models/addUserCatalogMember');
var createCatalogItemFromFileOrUrl = require('../Models/createCatalogItemFromFileOrUrl');
var loadView = require('../Core/loadView');
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

    // Chrome and Firefox can't agree on how to check if a string is included in the list of data transfer types.
    // Firefox has 'includes' and 'contains' but not 'indexOf', while Chrome only has 'indexOf'.
    // So we do this the hard way.
    function arrayContains(array, value) {
        for (var i = 0; i < array.length; ++i) {
            if (array[i] === value) {
                return true;
            }
        }

        return false;
    }

    this.dropTarget.addEventListener("dragenter", function(evt) {
        if (!evt.dataTransfer.types || !arrayContains(evt.dataTransfer.types, 'Files')) {
            return;
        }

        evt.preventDefault();
        that.showDropMessage = true;
    }, false);

    this.dropTarget.addEventListener("dragover", function(evt) {
        if (!evt.dataTransfer.types || !arrayContains(evt.dataTransfer.types, 'Files')) {
            return;
        }

        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }, false);

    this.dropTarget.addEventListener("dragleave", function(evt) {
        if (!evt.dataTransfer.types || !arrayContains(evt.dataTransfer.types, 'Files')) {
            return;
        }

        evt.preventDefault();

        if (evt.target.className === 'drag-drop') {
            that.showDropMessage = false;
        }
    }, false);

    this.dropTarget.addEventListener("drop", function(evt) {
        if (!evt.dataTransfer.types || !arrayContains(evt.dataTransfer.types, 'Files')) {
            return;
        }

        evt.preventDefault();

        that.showDropMessage = false;

        var files = evt.dataTransfer.files;
        for (var i = 0; i < files.length; ++i) {
            var file = files[i];
            ga('send', 'event', 'uploadFile', 'dragDrop', file.name);

            if (file.name.toUpperCase().indexOf('.JSON') !== -1) {
                readAndHandleJsonFile(that, file);
            } else {
                addFile(that, file);
            }
        }
    }, false);
};

DragDropViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/DragDrop.html', 'utf8'), container, this);
};

DragDropViewModel.create = function(container, options) {
    var viewModel = new DragDropViewModel(options);
    viewModel.show(container);
    return viewModel;
};

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