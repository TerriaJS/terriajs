'use strict';

/*global require,ga*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var addUserCatalogMember = require('../Models/addUserCatalogMember');
var createCatalogItemFromFileOrUrl = require('../Models/createCatalogItemFromFileOrUrl');
var loadView = require('../Core/loadView');
var raiseErrorOnRejectedPromise = require('../Models/raiseErrorOnRejectedPromise');
var readJson = require('../Core/readJson');

var DragDropViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

     this.terria = options.terria;

    this.dropTarget = undefined;
    if (defined(options.dropTarget)) {
        this.dropTarget = getElement(options.dropTarget);
    } else {
        this.dropTarget = document;
    }

    this.showDropMessage = false;
    this.allowDropDataFiles = defaultValue(options.allowDropDataFiles, true);
    this.allowDropInitFiles = defaultValue(options.allowDropInitFiles, true);

    /**
     * Gets or sets the list of elements or element IDs that are valid for dropping.
     * These elements plus all of the elements they contain, directly or indirectly, are
     * valid for dropping, unless they're also specified in one of the invalid lists.
     * @type {Array}
     */
    this.validDropElements = defaultValue(options.validDropElements, []).slice();

    /**
     * Gets or sets the list of CSS class names that are valid for dropping.  These elements
     * plus all of the elements they contain, directly or indirectly, are valid for dropping,
     * unless they're also specified in one the invalid lists.
     * @type {Array}
     */
    this.validDropClasses = defaultValue(options.validDropClasses, []).slice();

    /**
     * Gets or sets the list of elements or element IDs that are not valid for dropping,
     * even if they are present in one of the valid lists.
     * Dropping is not allowed in these elements or any elements they contain.
     * @type {Array}
     */
    this.invalidDropElements = defaultValue(options.invalidDropElements, []).slice();

    /**
     * Gets or sets the list of CSS class names that are not valid for dropping, even if they
     * are present in the one of valid lists.  Dropping is not allowed in these elements or
     * any elements they contain.
     * @type {Array}
     */
    this.invalidDropClasses = defaultValue(options.invalidDropClasses, []).slice();

    knockout.track(this, ['showDropMessage', 'allowDropDataFiles', 'allowDropInitFiles', 'validDropElements', 'invalidDropClasses']);

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

        if (!isValidDropTarget(that, evt.target)) {
            return;
        }

        evt.preventDefault();
        that.showDropMessage = true;
    }, false);

    this.dropTarget.addEventListener("dragover", function(evt) {
        if (!evt.dataTransfer.types || !arrayContains(evt.dataTransfer.types, 'Files')) {
            return;
        }

        if (!isValidDropTarget(that, evt.target)) {
            return;
        }

        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }, false);

    this.dropTarget.addEventListener("dragleave", function(evt) {
        if (!evt.dataTransfer.types || !arrayContains(evt.dataTransfer.types, 'Files')) {
            return;
        }

        if (!isValidDropTarget(that, evt.target)) {
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

        if (!isValidDropTarget(that, evt.target)) {
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

DragDropViewModel.create = function(options) {
    var viewModel = new DragDropViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};

function readAndHandleJsonFile(viewModel, file) {
    raiseErrorOnRejectedPromise(viewModel.terria, readJson(file).then(function(json) {
        if (viewModel.allowDropInitFiles && (json.catalog || json.services)) {
            // This is an init file.
            return viewModel.terria.addInitSource(json);
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

    return addUserCatalogMember(viewModel.terria, createCatalogItemFromFileOrUrl(viewModel.terria, file, 'auto', true));
}

function isValidDropTarget(viewModel, target) {
    var included = false;
    var excluded = false;

    var validDropClasses = viewModel.validDropClasses.map(function(item) {
        return new RegExp('(\\s|^)' + item + '(\\s|$)');
    });

    var invalidDropClasses = viewModel.invalidDropClasses.map(function(item) {
        return new RegExp('(\\s|^)' + item + '(\\s|$)');
    });

    var node = target;
    while (!excluded && node) {
        included = included || viewModel.validDropElements.indexOf(node.id) >= 0 || viewModel.validDropElements.indexOf(node) >= 0;

        var i;
        for (i = 0; !included && i < validDropClasses.length; ++i) {
            included = validDropClasses[i].test(node.className);
        }

        excluded = viewModel.invalidDropElements.indexOf(node.id) >= 0 || viewModel.invalidDropElements.indexOf(node) >= 0;

        for (i = 0; !excluded && i < invalidDropClasses.length; ++i) {
            excluded = invalidDropClasses[i].test(node.className);
        }

        node = node.parentNode;
    }

    return included && !excluded;
}

module.exports = DragDropViewModel;