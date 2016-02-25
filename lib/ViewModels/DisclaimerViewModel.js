"use strict";

var defined = require('terriajs-cesium/Source/Core/defined');
var PopupMessageViewModel = require('../ViewModels/PopupMessageViewModel');
var PopupMessageConfirmationViewModel = require('../ViewModels/PopupMessageConfirmationViewModel');

var DisclaimerViewModel = function(uiContainer, terria) {
    this._uiContainer = uiContainer;
    this.terria = terria;
    this._pending = {};

    this.terria.disclaimerEvent.addEventListener(this._handleInitialMessage.bind(this));
};

DisclaimerViewModel.prototype._handleInitialMessage = function(catalogItem, successCallback) {
    var keySpecified = defined(catalogItem.initialMessage.key);
    if (keySpecified && this.terria.getLocalProperty(catalogItem.initialMessage.key)) {
        successCallback();
        return;
    }


    if (catalogItem.initialMessage.confirmation) {
        if (keySpecified) {
            var key = catalogItem.initialMessage.key;

            if (defined(this._pending[key])) {
                this._pending[key].push(successCallback);
            } else {
                this._pending[key] = [successCallback];
                this._openConfirmationModal(catalogItem, this._executeCallbacksForKey.bind(this, key));
            }
        } else {
            this._openConfirmationModal(catalogItem, successCallback);
        }
    }
    else {
        if (keySpecified) {
            this.terria.setLocalProperty(catalogItem.initialMessage.key, true);
        }
        PopupMessageViewModel.open(this._uiContainer, options);
        successCallback();
    }
};

DisclaimerViewModel.prototype._openConfirmationModal = function(catalogItem, callback) {
    var options = {
        title: catalogItem.initialMessage.title,
        message: '<div>' + catalogItem.initialMessage.content + '</div>',
        width: catalogItem.initialMessage.width,
        height: catalogItem.initialMessage.height,
        confirmText: catalogItem.initialMessage.confirmText,
        confirmAction: callback
    };

    PopupMessageConfirmationViewModel.open(this._uiContainer, options);
};

DisclaimerViewModel.prototype._executeCallbacksForKey = function(id) {
    (this._pending[id] || []).forEach(function(cb) {cb()});
    this._pending[id] = undefined;
    this.terria.setLocalProperty(id, true);
};

DisclaimerViewModel.create = function(options) {
    return new DisclaimerViewModel(options.container, options.terria);
};

module.exports = DisclaimerViewModel;
