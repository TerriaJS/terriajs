'use strict';

/*global require*/

var CatalogItemControl = require('./CatalogItemControl');
var CatalogItemDownloadControl = require('./CatalogItemDownloadControl');

var registerCatalogItemControls = function() {
    CatalogItemControl.registerRightSideControl('download', CatalogItemDownloadControl, "downloadUrl");
};

module.exports = registerCatalogItemControls;
