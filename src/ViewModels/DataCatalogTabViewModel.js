'use strict';

/*global require*/
var createFragmentFromTemplate = require('../Core/createFragmentFromTemplate');
var ExplorerTabViewModel = require('./ExplorerTabViewModel');
var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var DataCatalogTabViewModel = function(catalog) {
    ExplorerTabViewModel.call(this);

    this.name = 'Data Catalogue';
    this.catalog = catalog;
};

inherit(ExplorerTabViewModel, DataCatalogTabViewModel);

DataCatalogTabViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/DataCatalogTab.html', 'utf8'), container, this);
};

module.exports = DataCatalogTabViewModel;
