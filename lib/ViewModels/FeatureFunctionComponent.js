'use strict';

/*global require*/
var InvokeFunctionPanelViewModel = require('./InvokeFunctionPanelViewModel');
var loadView = require('../Core/loadView');

var FeatureFunctionComponent = function(options) {
    this._container = options.container;

    this.catalogFunction = options.catalogFunction;
    this.initialValues = options.initialValues;
};

FeatureFunctionComponent.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/FeatureFunctionComponent.html', 'utf8'), container, this);
};

FeatureFunctionComponent.prototype.invoke = function() {
    this.catalogFunction.terria.analytics.logEvent('dataSource', 'clickAdd', this.catalogFunction.name);
    InvokeFunctionPanelViewModel.open({
        container: this._container,
        initialParameterValues: this.initialValues,
        catalogFunction: this.catalogFunction
    });
};

module.exports = FeatureFunctionComponent;
