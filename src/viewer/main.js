"use strict";

/*global require,$*/

var start = true;

var PopupMessage = require('./PopupMessage');

// If we're not in a normal browser environment (Web Worker maybe?), do nothing.
if (typeof window === 'undefined') {
    start = false;
} else {
    var browser = $.browser;
    if (browser.msie === true && parseInt(browser.version, 10) < 9) {
        var oldBrowserMessage = new PopupMessage({
            container : document.body,
            title : 'Internet Explorer 8 or earlier detected',
            message : '\
    National Map requires Internet Explorer 9 or later.  For the best experience, we recommend \
    <a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
    <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
    <a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
        });

        start = false;
    }
}

if (start) {
    // IE9 doesn't have a console object until the debugging tools are opened.
    if (typeof window.console === 'undefined') {
        window.console = {
            log : function() {}
        };
    }

    var browser = $.browser;


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
