"use strict";

/*global require*/

var start = true;

var PopupMessage = require('./viewer/PopupMessage');
var FeatureDetection = require('../third_party/cesium/Source/Core/FeatureDetection');

// If we're not in a normal browser environment (Web Worker maybe?), do nothing.
if (typeof window === 'undefined') {
    start = false;
} else {
    if (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 9) {
        PopupMessage.open({
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

    window.CESIUM_BASE_URL = 'build/Cesium/';

    var copyright = require('./CopyrightModule'); // jshint ignore:line

    var SvgPathBindingHandler = require('../third_party/cesium/Source/Widgets/SvgPathBindingHandler');
    var knockout = require('../third_party/cesium/Source/ThirdParty/knockout');

    var AusGlobeViewer = require('./viewer/AusGlobeViewer');
    var ApplicationViewModel = require('./ViewModels/ApplicationViewModel');
    var KnockoutSanitizedHtmlBinding = require('./viewer/KnockoutSanitizedHtmlBinding');
    var raiseErrorToUser = require('./ViewModels/raiseErrorToUser');
    var registerCatalogViewModels = require('./ViewModels/registerCatalogViewModels');

    SvgPathBindingHandler.register(knockout);
    KnockoutSanitizedHtmlBinding.register(knockout);
    registerCatalogViewModels();

    var application = new ApplicationViewModel();
    application.catalog.isLoading = true;

    application.error.addEventListener(function(e) {
        PopupMessage.open({
            container: document.body,
            title: e.title,
            message: e.message
        });
    });

    application.start({
        applicationUrl: window.location,
        configUrl: 'config.json',
        initializationUrl: 'init_nm.json',
        useUrlHashAsInitSource: true
    }).otherwise(function(e) {
        raiseErrorToUser(application, e);
    }).always(function() {
        // Watch the hash portion of the URL.  If it changes, try to interpret as an init source.
        window.addEventListener("hashchange", function() {
            application.updateApplicationUrl(window.location);
        }, false);

        application.catalog.isLoading = false;

        AusGlobeViewer.create(application);

        document.getElementById('loadingIndicator').style.display = 'none';
    });
}
