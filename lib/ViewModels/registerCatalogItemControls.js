'use strict';

/*global require*/

var CatalogItemControl = require('./CatalogItemControl');
var CatalogItemDownloadControl = require('./CatalogItemDownloadControl');
var CatalogItemEmbeddedContentControl = require('./CatalogItemEmbeddedContentControl');

var registerCatalogItemControls = function() {
    CatalogItemControl.registerRightSideControl('download', CatalogItemDownloadControl, "downloadUrl");
    CatalogItemControl.registerRightSideControl('embedded', CatalogItemEmbeddedContentControl, "embeddedUrl");
};

module.exports = registerCatalogItemControls;
