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
    var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
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
    application.catalog.isLoading = true;

    application.error.addEventListener(function(e) {
        var message = new PopupMessage({
            container : document.body,
            title: e.title,
            message: e.message
        });
    });

    var url = window.location;
    var uri = new URI(url);
    var urlParameters = uri.search(true);
    var hash = uri.fragment();

    loadJson(urlParameters.config || 'config.json').then(function(config) {
        // Always initialize from init_nm.json
        application.initSources.push('init_nm.json');

        // If the URL includes a hash, try loading the corresponding init file.
        var startData = {};
        if (defined(hash) && hash.length > 0) {
            if (hash.indexOf('start=') === 0) {
                startData = JSON.parse(decodeURIComponent(hash.substring(6)));
            } else if (hash.toLowerCase() !== 'populate-cache') {
                application.initSources.push('init_' + hash + ".json");
            }
        }

        var initSources = application.initSources.slice();

        // Include any initSources specified in the URL.
        if (defined(startData.initSources)) {
            for (var i = 0; i < startData.initSources.length; ++i) {
                var initSource = startData.initSources[i];
                if (initSources.indexOf(initSource) < 0) {
                    initSources.push(initSource);

                    // Only add external files to the application's list of init sources.
                    if (typeof initSource === 'string') {
                        application.initSources.push(initSource);
                    }
                }
            }
        }

        // Load all of the init sources.
        when.all(initSources.map(loadInitSource), function(initSources) {
            var corsDomains = [];
            var camera;
            var i;
            var initSource;

            for (i = 0; i < initSources.length; ++i) {
                initSource = initSources[i];
                if (!defined(initSource)) {
                    continue;
                }

                // Extract the list of CORS-ready domains from the init sources.
                if (defined(initSource.corsDomains)) {
                    corsDomains.push.apply(corsDomains, initSource.corsDomains);
                }

                // The last init source to specify a camera position wins.
                if (defined(initSource.camera)) {
                    camera = initSource.camera;
                }
            }

            // Configure the proxy.
            // IE versions prior to 10 don't support CORS, so always use the proxy.
            var alwaysUseProxy = (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 10);
            corsProxy.setProxyList(config.proxyDomains, corsDomains, alwaysUseProxy);

            var promises = [];

            // Make another pass over the init sources to update the catalog and load services.
            for (i = 0; i < initSources.length; ++i) {
                initSource = initSources[i];
                if (!defined(initSource)) {
                    continue;
                }

                if (defined(initSource.catalog)) {
                    var isUserSupplied;
                    if (initSource.isFromExternalFile) {
                        isUserSupplied = false;
                    } else if (initSource.catalogOnlyUpdatesExistingItems) {
                        isUserSupplied = undefined;
                    } else {
                        isUserSupplied = true;
                    }

                    try {
                        promises.push(application.catalog.updateFromJson(initSource.catalog, {
                            onlyUpdateExistingItems: initSource.catalogOnlyUpdatesExistingItems,
                            isUserSupplied: isUserSupplied
                        }));
                    } catch(e) {
                        var message = new PopupMessage({
                            container: document.body,
                            title: 'An error occurred while loading the catalog',
                            message: e.toString()
                        });
                    }
                }

                if (defined(initSource.services)) {
                    application.services.services.push.apply(application.services, initSource.services);
                }
            }

            when.all(promises, function() {
                application.catalog.isLoading = false;

                var viewer = new AusGlobeViewer(application, camera);

                document.getElementById('loadingIndicator').style.display = 'none';
            });
        });
    });
}

function loadInitSource(source) {
    if (typeof source === 'string') {
        return loadJson(source).then(function(initSource) {
            initSource.isFromExternalFile = true;
            return initSource;
        }).otherwise(function() {
            var message = new PopupMessage({
                container : document.body,
                title: 'Error loading initialization source',
                message: 'An error occurred while loading initialization information from ' + source + '.  This may indicate that you followed an invalid link or that there is a problem with your Internet connection.'
            });
            return undefined;
        });
    } else {
        return source;
    }
}
