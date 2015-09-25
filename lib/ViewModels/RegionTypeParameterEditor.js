'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var RegionTypeParameterEditor = function(catalogFunction, parameter, parameterValues) {
    this.catalogFunction = catalogFunction;
    this.parameter = parameter;

    knockout.defineProperty(this, 'value', {
        get: function() {
            return parameterValues[parameter.id];
        },
        set: function(value) {
            parameterValues[parameter.id] = value;
        }
    });

    knockout.defineProperty(this, 'regions', {
        get: function() {
            // TODO: get this from the region mapping config file.
            // Probably use RegionProvider instances from region-mapping-advanced-matching branch.
            return [
                'LGA',
                'SA1',
                'SA2',
                'SA3',
                'SA4',
                'POA',
                'CED'
            ];
        }
    });
};

RegionTypeParameterEditor.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/RegionTypeParameterEditor.html', 'utf8'), container, this);
};

module.exports = RegionTypeParameterEditor;
