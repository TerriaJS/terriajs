'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var RegionTypeParameterEditor = function(catalogFunction, parameter, parameterValues) {
    this.catalogFunction = catalogFunction;
    this.parameter = parameter;

    this.regionProviders = [];
    knockout.track(this, ['regionProviders']);

    knockout.defineProperty(this, 'value', {
        get: function() {
            return parameterValues[parameter.id];
        },
        set: function(value) {
            parameterValues[parameter.id] = value;
        }
    });

    var that = this;
    parameter.getAllRegionTypes().then(function(regionProviders) {
        that.regionProviders = regionProviders;
    });
};

RegionTypeParameterEditor.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/RegionTypeParameterEditor.html', 'utf8'), container, this);
};

module.exports = RegionTypeParameterEditor;
