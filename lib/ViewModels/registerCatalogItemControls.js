'use strict';

/*global require*/
var registerCatalogMemberControls = require('./registerCatalogMemberControls');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');

deprecationWarning('registerCatalogItemControls', 'registerCatalogItemControls is deprecated.  Please use registerCatalogMemberControls instead');

module.exports = registerCatalogMemberControls;