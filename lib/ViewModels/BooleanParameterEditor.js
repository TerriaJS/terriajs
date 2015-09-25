'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var BooleanParameterEditor = function(catalogFunction, parameter, parameterValues) {
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
};

BooleanParameterEditor.prototype.show = function(container) {
    loadView('<label><input type="checkbox" data-bind="checked: value, attr { title: parameter.description }" /> <span data-bind="text: parameter.name"></span></label>', container, this);
};

module.exports = BooleanParameterEditor;
