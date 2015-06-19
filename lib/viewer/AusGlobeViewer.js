'use strict';

/*global require*/
var TerriaViewer = require('../ViewModels/TerriaViewer');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');

deprecationWarning('AusGlobeViewer', 'AusGlobeViewer is deprecated.  Please use TerriaViewer instead');

module.exports = TerriaViewer;