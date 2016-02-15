'use strict';

/*global require*/
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var DateTimeParameterEditor = function(catalogFunction, parameter, parameterValues) {
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

defineProperties(DateTimeParameterEditor.prototype, {
    elementID: {
        get: function() {
            return 'parameter-editor-dateTime' + encodeURIComponent(this.parameter.id);
        }
    }
});

DateTimeParameterEditor.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/DateTimeParameterEditor.html', 'utf8'), container, this);
};

module.exports = DateTimeParameterEditor;
