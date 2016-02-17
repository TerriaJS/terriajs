'use strict';

/*global require*/
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var PointParameterEditor = function(catalogFunction, parameter, parameterValues) {
    this.catalogFunction = catalogFunction;
    this.parameter = parameter;

    knockout.defineProperty(this, 'value', {
        get: function() {
            var cartographic = parameterValues[parameter.id];
            if (defined(cartographic)) {
                return CesiumMath.toDegrees(cartographic.longitude) + ',' + CesiumMath.toDegrees(cartographic.latitude);
            } else {
                return '';
            }
        },
        set: function(value) {
            var coordinates = value.split(',');
            if (coordinates.length >= 2) {
                parameterValues[parameter.id] = Cartographic.fromDegrees(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
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
    loadView(require('fs').readFileSync(__dirname + '/../Views/GenericParameterEditor.html'), container, this);
};

module.exports = PointParameterEditor;
