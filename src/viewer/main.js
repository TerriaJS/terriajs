"use strict";

/*global require*/

// If we're not in a normal browser environment (Web Worker maybe?), do nothing.
if (typeof window !== 'undefined') {
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
    var TaskProcessor = require('../../public/cesium/Source/Core/TaskProcessor');

    var GeoDataCollection = require('../GeoDataCollection');
    var AusGlobeViewer = require('./AusGlobeViewer');

    TaskProcessor._bootstrapperScript = '../../../build/cesiumWorkerBootstrapper.js';

    SvgPathBindingHandler.register(knockout);

    var geoDataManager = new GeoDataCollection();

    var viewer = new AusGlobeViewer(geoDataManager);
}
