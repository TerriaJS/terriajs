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

    window.CESIUM_BASE_URL = 'build/Cesium/';

    var copyright = require('../CopyrightModule');

    var SvgPathBindingHandler = require('../../third_party/cesium/Source/Widgets/SvgPathBindingHandler');
    var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
    var TaskProcessor = require('../../third_party/cesium/Source/Core/TaskProcessor');

    var GeoDataCollection = require('../GeoDataCollection');
    var AusGlobeViewer = require('./AusGlobeViewer');

    SvgPathBindingHandler.register(knockout);

    var geoDataManager = new GeoDataCollection();

    var viewer = new AusGlobeViewer(geoDataManager);
}
