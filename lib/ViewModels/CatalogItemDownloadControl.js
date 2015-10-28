'use strict';

/*global require*/
var CatalogMemberDownloadControl = require('./CatalogMemberDownloadControl');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');

deprecationWarning('CatalogItemDownloadControl', 'CatalogItemDownloadControl is deprecated.  Please use CatalogMemberDownloadControl instead');

module.exports = CatalogMemberDownloadControl;