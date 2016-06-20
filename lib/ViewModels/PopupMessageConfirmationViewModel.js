'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var PopupMessageViewModel = require('./PopupMessageViewModel');

var PopupMessageConfirmationViewModel = function(options) {
    PopupMessageViewModel.call(this, options);

    this.title = defaultValue(options.title, 'Confirm');

    this.confirmText = defaultValue(options.confirmText, 'OK');
    this.confirmAction = defaultValue(options.confirmAction, function() {});

    this.confirmActionAndClose = function() {
        this.confirmAction();
        this.close();
    };

    // enableDeny needs be explicitly set, because there is no good default denyAction to take.
    this.enableDeny = defaultValue(options.enableDeny, false);
    this.denyText = defaultValue(options.denyText, 'Cancel');
    this.denyAction = defaultValue(options.denyAction, function() {});

    knockout.track(this, ['confirmText', 'denyText']);
};

inherit(PopupMessageViewModel, PopupMessageConfirmationViewModel);

PopupMessageConfirmationViewModel.open = function(container, options) {
    var viewModel = new PopupMessageConfirmationViewModel(options);
    viewModel.show(container);
    return viewModel;
};

module.exports = PopupMessageConfirmationViewModel;
