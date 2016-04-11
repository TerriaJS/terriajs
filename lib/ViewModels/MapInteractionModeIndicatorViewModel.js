'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

function MapInteractionModeIndicatorViewModel(options) {
    this.terria = options.terria;

    knockout.defineProperty(this, 'interactionMode', {
        get: function() {
            return this.terria.mapInteractionModeStack[this.terria.mapInteractionModeStack.length - 1];
        }
    });
}

MapInteractionModeIndicatorViewModel.prototype.show = function(container) {
    loadView(require('../Views/MapInteractionModeIndicator.html'), container, this);
};

MapInteractionModeIndicatorViewModel.create = function(options) {
    var viewModel = new MapInteractionModeIndicatorViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};

module.exports = MapInteractionModeIndicatorViewModel;
