"use strict";

var defined = require('terriajs-cesium/Source/Core/defined');
var PopupMessageViewModel = require('../ViewModels/PopupMessageViewModel');
var PopupMessageConfirmationViewModel = require('../ViewModels/PopupMessageConfirmationViewModel');

/**
 * Shows disclaimers for {@link CatalogItem}s that are dispatched through {@link Terria#disclaimerEvent} - ensures that
 * disclaimers that share the same key (as specified in {@link CatalogItem#initialMessage#key}) are only ever displayed
 * once per key - if a single disclaimer is triggered 3 different times, for instance, one disclaimer popup will be
 * displayed, and then once that disclaimer is accepted, the callbacks for all three {@Terria#disclaimerEvent} will be
 * executed. This response will be persisted in localStorage so that subsequent calls to {@Terria#disclaimerEvent} do
 * not display any disclaimer and have their successCallback executed immediately.
 *
 * Also accepts disclaimers with no key, which will always be displayed, and disclaimers with no need for confirmation
 * (as specified by {@link CatalogItem#initialMessage#confirmation}), which will have their successCallback executed
 * immediately as the message is shown.
 *
 * Note that this is not for displaying a general disclaimer on startup.
 *
 * @param uiContainer The ui container to display modals within.
 * @param terria The {@link Terria} instance to use.
 * @constructor
 */
var DisclaimerViewModel = function(uiContainer, terria) {
    this._uiContainer = uiContainer;
    this.terria = terria;
    this._pending = {};

    this.terria.disclaimerEvent.addEventListener(this._handleInitialMessage.bind(this));
};

/**
 * Handles the {@Terria#disclaimerEvent} being raised. Only one disclaimer will be shown for each catalogItem with the
 * same {@link CatalogItem#initialMessage#key}, but all calls will have their successCallback executed when it's
 * accepted.
 *
 * @param catalogItem The catalog item to display a disclaimer for.
 * @param successCallback A callback to execute once the disclaimer is accepted.
 * @private
 */
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
        PopupMessageViewModel.open(this._uiContainer, generateOptions(catalogItem));
        successCallback();
    }
};

/**
 * Opens a confirmation modal for the specified {@link CatalogItem}.
 *
 * @param catalogItem The catalog item to get disclaimer details from.
 * @param callback The callback to execute when the modal is dismissed.
 * @private
 */
DisclaimerViewModel.prototype._openConfirmationModal = function(catalogItem, callback) {
    var options = generateOptions(catalogItem);
    options.confirmAction = callback;

    PopupMessageConfirmationViewModel.open(this._uiContainer, options);
};

/**
 * Executes all the callbacks stored in {@link DisclaimerViewModal#pending} for the specified key, and clears that key
 * in pending.
 *
 * @param key The key to get callbacks from.
 * @private
 */
DisclaimerViewModel.prototype._executeCallbacksForKey = function(key) {
    (this._pending[key] || []).forEach(function(cb) {cb()});
    this._pending[key] = undefined;
    this.terria.setLocalProperty(key, true);
};

/**
 * Creates a copy of the object with a signature that matches other viewmodels.
 *
 * @param options Options to execute.
 * @param options.uiContainer The ui container to display modals within.
 * @param options.terria The {@link Terria} instance to use.
 *
 * @returns {DisclaimerViewModel}
 */
DisclaimerViewModel.create = function(options) {
    return new DisclaimerViewModel(options.container, options.terria);
};

/**
 * Generates options for {@link PopupMessageConfirmationViewModel} and {@link PopupMessageViewModel} for a
 * {@link CatalogItem}
 * @returns {{title: string, message: string, width: number, height: number, confirmText: string}}
 */
function generateOptions(catalogItem) {
    return {
        title: catalogItem.initialMessage.title,
        message: '<div>' + catalogItem.initialMessage.content + '</div>',
        width: catalogItem.initialMessage.width,
        height: catalogItem.initialMessage.height,
        confirmText: catalogItem.initialMessage.confirmText
    };
}

module.exports = DisclaimerViewModel;
