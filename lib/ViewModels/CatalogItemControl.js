'use strict';

/*global require*/
var CatalogMemberControl = require('./CatalogMemberControl');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');

deprecationWarning('CatalogItemControl', 'CatalogItemControl is deprecated.  Please use CatalogMemberControl instead');

module.exports = CatalogMemberControl;