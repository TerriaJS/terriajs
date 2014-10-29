"use strict";

/*global require,$,URI*/

var start = true;

var PopupMessage = require('./PopupMessage');
var FeatureDetection = require('../../third_party/cesium/Source/Core/FeatureDetection');

// If we're not in a normal browser environment (Web Worker maybe?), do nothing.
if (typeof window === 'undefined') {
    start = false;
} else {
    if (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 9) {
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

    window.CESIUM_BASE_URL = 'build/Cesium/';

    var copyright = require('../CopyrightModule');

    var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
    var defined = require('../../third_party/cesium/Source/Core/defined');
    var SvgPathBindingHandler = require('../../third_party/cesium/Source/Widgets/SvgPathBindingHandler');
    var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
    var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
    var when = require('../../third_party/cesium/Source/ThirdParty/when');

    var AusGlobeViewer = require('./AusGlobeViewer');
    var corsProxy = require('../Core/corsProxy');
    var ApplicationViewModel = require('../ViewModels/ApplicationViewModel');
    var CatalogViewModel = require('../ViewModels/CatalogViewModel');
    var KnockoutSanitizedHtmlBinding = require('./KnockoutSanitizedHtmlBinding');
    var PopupMessage = require('./PopupMessage');
    var NowViewingViewModel = require('../ViewModels/NowViewingViewModel');
    var registerCatalogViewModels = require('../ViewModels/registerCatalogViewModels');

    SvgPathBindingHandler.register(knockout);
    KnockoutSanitizedHtmlBinding.register(knockout);
    registerCatalogViewModels();

    var application = new ApplicationViewModel();

    application.error.addEventListener(function(e) {
        var message = new PopupMessage({
            container : document.body,
            title: e.title,
            message: e.message
        });
    });

    var configFiles = [];

    var url = window.location;
    var uri = new URI(url);
    var urlParameters = uri.search(true);

    configFiles.push(urlParameters.config || 'config.json');

    var hash = uri.fragment();
    if (defined(hash) && hash.length > 0) {
        configFiles.push(hash + ".json");
    }

    var startData = urlParameters.start ? JSON.parse(urlParameters.start) : {};

    application.catalog.isLoading = true;

    when.all(configFiles.map(loadJson), function(loadedConfigFiles) {
        // IE versions prior to 10 don't support CORS, so always use the proxy.
        var alwaysUseProxy = (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 10);

        // Determine the set of initialization sources, as well as the proxy and CORS domains to use.
        var proxyDomains = [];
        var corsDomains = [];
        var camera;

        for (var i = 0; i < loadedConfigFiles.length; ++i) {
            var loadedConfigFile = loadedConfigFiles[i];

            if (defined(loadedConfigFile.initialDataMenu)) {
                application.initSources.push(loadedConfigFile.initialDataMenu);
            }

            if (defined(loadedConfigFile.proxyDomains)) {
                proxyDomains.push.apply(proxyDomains, loadedConfigFile.proxyDomains);
            }

            if (defined(loadedConfigFile.corsDomains)) {
                proxyDomains.push.apply(corsDomains, loadedConfigFile.corsDomains);
            }

            if (defined(loadedConfigFile.initialCamera)) {
                camera = loadedConfigFile.initialCamera;
            }
        }

        corsProxy.setProxyList(proxyDomains, corsDomains, alwaysUseProxy);

        if (defined(startData.initSources)) {
            application.initSources.push.apply(application.initSources, startData.initSources);
        }

        function loadInitSource(source) {
            if (typeof source === 'string') {
                return loadJson(source);
            } else {
                return source;
            }
        }

        when.all(application.initSources.map(loadInitSource), function(initJsons) {
            // Load the various bits of the catalog.
            var i;
            for (i = 0; i < initJsons.length; ++i) {
                var initJson = initJsons[i];

                try {
                    application.catalog.updateFromJson(initJson.catalog);
                } catch(e) {
                    var message = new PopupMessage({
                        container: document.body,
                        title: 'An error occurred while loading the catalog',
                        message: e.toString()
                    });
                }

                if (defined(initJson.camera)) {
                    camera = initJson.camera;
                }
            }

            application.catalog.isLoading = false;

            var viewer = new AusGlobeViewer(application, camera);

            document.getElementById('loadingIndicator').style.display = 'none';
        });
    });
}
