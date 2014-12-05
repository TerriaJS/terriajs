'use strict';

/*global require*/
var ExplorerTabViewModel = require('./ExplorerTabViewModel');
var inherit = require('../Core/inherit');

var DataCatalogueTabViewModel = function(catalog) {
    ExplorerTabViewModel.call(this, 'Data Catalogue');
};

inherit(ExplorerTabViewModel, DataCatalogueTabViewModel);

DataCatalogueTabViewModel.create = function(catalog) {
};

module.exports = DataCatalogueTabViewModel;