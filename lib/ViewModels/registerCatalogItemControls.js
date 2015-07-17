'use strict';

/*global require*/

var DataCatalogTabViewModel = require('./DataCatalogTabViewModel');
var CatalogItemDownloadControl = require('./CatalogItemDownloadControl');

var registerCatalogItemControls = function() {
    DataCatalogTabViewModel.registerRightSideItemControl('download', CatalogItemDownloadControl, "downloadUrl");
};

module.exports = registerCatalogItemControls;
