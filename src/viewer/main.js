"use strict";

/*global require*/

// IE9 doesn't have a console object until the debugging tools are opened.
if (typeof window.console === 'undefined') {
    window.console = {
        log : function() {}
    };
}

window.CESIUM_BASE_URL = 'cesium/Build/Cesium/';

var copyright = require('../CopyrightModule');

var SvgPathBindingHandler = require('../../public/cesium/Source/Widgets/SvgPathBindingHandler');
var knockout = require('../../public/cesium/Source/ThirdParty/knockout');

var GeoDataCollection = require('../GeoDataCollection');
var AusGlobeViewer = require('./AusGlobeViewer');

SvgPathBindingHandler.register(knockout);

var geoDataManager = new GeoDataCollection();

var viewer = new AusGlobeViewer(geoDataManager);
