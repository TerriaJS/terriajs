'use strict';

/*global require*/

var CatalogMemberControl = require('./CatalogMemberControl');
var CatalogMemberDownloadControl = require('./CatalogMemberDownloadControl');
var CatalogMemberEmbeddedContentControl = require('./CatalogMemberEmbeddedContentControl');

var registerCatalogMemberControls = function() {
    // Register with a unique control name, control class and required property name.
    CatalogMemberControl.registerRightSideControl('download', CatalogMemberDownloadControl, "downloadUrl");
    CatalogMemberControl.registerRightSideControl('embedded', CatalogMemberEmbeddedContentControl, "embeddedUrl");
};

module.exports = registerCatalogMemberControls;
