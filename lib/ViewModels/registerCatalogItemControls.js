'use strict';

/*global require*/

var DataCatalogTabViewModel = require('./DataCatalogTabViewModel');
var CatalogItemDownloadControl = require('./CatalogItemDownloadControl');
var CatalogItemEmbeddedContentControl = require('./CatalogItemEmbeddedContentControl');

var registerCatalogItemControls = function() {
    DataCatalogTabViewModel.registerRightSideItemControl('download', CatalogItemDownloadControl, "downloadUrl");
    DataCatalogTabViewModel.registerRightSideItemControl('embedded', CatalogItemEmbeddedContentControl, "embeddedUrl");
};

module.exports = registerCatalogItemControls;
