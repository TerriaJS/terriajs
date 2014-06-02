"use strict";

/*global require*/
var GeoDataCollection = require('../GeoDataCollection');
var AusGlobeViewer = require('./AusGlobeViewer');

var geoDataManager = new GeoDataCollection();

// uncomment this line for local geospace testing
//geoDataManager.visStore = 'http://localhost:3000';
console.log('The VisStore is set to:', geoDataManager.visStore);

var viewer = new AusGlobeViewer(geoDataManager);
