'use strict';

/*global require*/

var CatalogMemberControl = require('./CatalogMemberControl');
var CatalogMemberDownloadControl = require('./CatalogMemberDownloadControl');

var registerCatalogMemberControls = function() {
    CatalogMemberControl.registerRightSideControl('download', CatalogMemberDownloadControl, "downloadUrl");
};

module.exports = registerCatalogMemberControls;
