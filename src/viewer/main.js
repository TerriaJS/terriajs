"use strict";

/*global require,Cesium*/

var SvgPathBindingHandler = Cesium.SvgPathBindingHandler;
var knockout = require('knockout');

// IE9 doesn't have a console object until the debugging tools are opened.
if (typeof window.console === 'undefined') {
    window.console = {
        log : function() {}
    };
}

SvgPathBindingHandler.register(knockout);

/*global require*/
var GeoDataCollection = require('../GeoDataCollection');
var AusGlobeViewer = require('./AusGlobeViewer');

var geoDataManager = new GeoDataCollection();

// uncomment this line for local geospace testing
//geoDataManager.visStore = 'http://localhost:3000';
console.log('The VisStore is set to:', geoDataManager.visStore);

var viewer = new AusGlobeViewer(geoDataManager);
