'use strict';

/*global require*/
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');
var MapInteractionMode = require('../Models/MapInteractionMode');

var PointParameterEditor = function(options) {
    this.catalogFunction = options.catalogFunction;
    this.parameter = options.parameter;
    this.parameterValues = options.parameterValues;
    this.invokeFunctionPanel = options.invokeFunctionPanel;

    knockout.defineProperty(this, 'value', {
        get: function() {
            if (!defined(knockout.getObservable(this.parameterValues, this.parameter.id))) {
                knockout.track(this.parameterValues, [this.parameter.id]);
            }

            var cartographic = this.parameterValues[this.parameter.id];
            if (defined(cartographic)) {
                return CesiumMath.toDegrees(cartographic.longitude) + ',' + CesiumMath.toDegrees(cartographic.latitude);
            } else {
                return '';
            }
        },
        set: function(value) {
            var coordinates = value.split(',');
            if (coordinates.length >= 2) {
                this.parameterValues[this.parameter.id] = Cartographic.fromDegrees(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
            }
        }
    });
};

defineProperties(PointParameterEditor.prototype, {
    elementID: {
        get: function() {
            return 'parameter-editor-point' + encodeURIComponent(this.parameter.id);
        }
    }
});

PointParameterEditor.prototype.show = function(container) {
    loadView(require('../Views/PointParameterEditor.html'), container, this);
};

PointParameterEditor.prototype.selectPointOnMap = function() {
    var terria = this.catalogFunction.terria;

    // Cancel any feature picking already in progress.
    terria.pickedFeatures = undefined;

    var pickPointMode = new MapInteractionMode({
        message: 'Select a point by clicking on the map.',
        onCancel: function() {
            terria.mapInteractionModeStack.pop();
            that.invokeFunctionPanel.isVisible = true;
        }
    });
    terria.mapInteractionModeStack.push(pickPointMode);

    var that = this;
    knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
        if (defined(pickedFeatures.pickPosition)) {
            that.parameterValues[that.parameter.id] = Ellipsoid.WGS84.cartesianToCartographic(pickedFeatures.pickPosition);
            terria.mapInteractionModeStack.pop();
            that.invokeFunctionPanel.isVisible = true;
        }
    });

    this.invokeFunctionPanel.isVisible = false;
};

module.exports = PointParameterEditor;
