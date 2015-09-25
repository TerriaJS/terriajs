'use strict';

/*global require*/
var loadView = require('../Core/loadView');

var GenericParameterEditor = function(catalogFunction, parameter) {
    this.catalogFunction = catalogFunction;
    this.parameter = parameter;
};

GenericParameterEditor.prototype.show = function(container) {
    loadView('<div data-bind="text: parameter.name, attr: { title: parameter.description }"></div>', container, this);
};

module.exports = GenericParameterEditor;