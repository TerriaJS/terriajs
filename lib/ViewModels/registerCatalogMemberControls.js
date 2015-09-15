'use strict';

/*global require*/

var CatalogMemberControl = require('./CatalogMemberControl');
var CatalogMemberDownloadControl = require('./CatalogMemberDownloadControl');
var CatalogMemberEmbeddedContentControl = require('./CatalogMemberEmbeddedContentControl');

var registerCatalogMemberControls = function() {
    CatalogMemberControl.registerRightSideControl('download', CatalogMemberDownloadControl, "downloadUrl");
    CatalogMemberControl.registerRightSideControl('embedded', CatalogMemberEmbeddedContentControl, "embeddedUrl");
};

module.exports = registerCatalogMemberControls;
