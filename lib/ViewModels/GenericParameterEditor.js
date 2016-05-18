'use strict';

/*global require*/
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var GenericParameterEditor = function(options) {
    this.catalogFunction = options.catalogFunction;
    this.parameter = options.parameter;

    var parameterValues = options.parameterValues;
    knockout.defineProperty(this, 'value', {
        get: function() {
            return parameterValues[this.parameter.id];
        },
        set: function(value) {
            parameterValues[this.parameter.id] = value;
        }
    });
};

defineProperties(GenericParameterEditor.prototype, {
    elementID: {
        get: function() {
            return 'parameter-editor-dateTime' + encodeURIComponent(this.parameter.id);
        }
    }
});

GenericParameterEditor.prototype.show = function(container) {
    loadView(require('../Views/GenericParameterEditor.html'), container, this);
};

module.exports = GenericParameterEditor;
