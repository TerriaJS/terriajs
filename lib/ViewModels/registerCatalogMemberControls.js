'use strict';

/*global require*/

var CatalogMemberControl = require('./CatalogMemberControl');
var CatalogMemberDownloadControl = require('./CatalogMemberDownloadControl');

var registerCatalogMemberControls = function() {
    // Register with a unique control name, control class and required property name.
    CatalogMemberControl.registerRightSideControl('download', CatalogMemberDownloadControl, "downloadUrl");
};

module.exports = registerCatalogMemberControls;
