'use strict';

/*global require*/
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var BooleanParameterEditor = function(options) {
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

defineProperties(BooleanParameterEditor.prototype, {
    elementID: {
        get: function() {
            return 'parameter-editor-boolean' + encodeURIComponent(this.parameter.id);
        }
    },

    trueDescription: {
        get: function() {
            return this.parameter.trueDescription ? this.parameter.trueDescription : this.parameter.description;
        }
    },

    falseDescription: {
        get: function() {
            return this.parameter.falseDescription ? this.parameter.falseDescription : this.parameter.description;
        }
    }
});

BooleanParameterEditor.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/BooleanParameterEditor.html', 'utf8'), container, this);
};

module.exports = BooleanParameterEditor;
