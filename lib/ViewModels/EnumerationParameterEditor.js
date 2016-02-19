'use strict';

/*global require*/
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var EnumerationParameterEditor = function(options) {
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

defineProperties(EnumerationParameterEditor.prototype, {
    elementID: {
        get: function() {
            return 'parameter-editor-enumeration' + encodeURIComponent(this.parameter.id);
        }
    }
});

EnumerationParameterEditor.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/EnumerationParameterEditor.html', 'utf8'), container, this);
};

module.exports = EnumerationParameterEditor;
