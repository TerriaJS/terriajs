"use strict";

/*global require*/

var start = true;

var PopupMessageViewModel = require('./ViewModels/PopupMessageViewModel');
var FeatureDetection = require('../third_party/cesium/Source/Core/FeatureDetection');

// If we're not in a normal browser environment (Web Worker maybe?), do nothing.
if (typeof window === 'undefined') {
    start = false;
} else {
    if (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 9) {
        PopupMessageViewModel.open('ui', {
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

    var BrandBarViewModel = require('./ViewModels/BrandBarViewModel');
    var DataCatalogTabViewModel = require('./ViewModels/DataCatalogTabViewModel');
    var DistanceLegendViewModel = require('./ViewModels/DistanceLegendViewModel');
    var ExplorerPanelViewModel = require('./ViewModels/ExplorerPanelViewModel');
    var LocationBarViewModel = require('./ViewModels/LocationBarViewModel');
    var MenuBarViewModel = require('./ViewModels/MenuBarViewModel');
    var MenuBarItemViewModel = require('./ViewModels/MenuBarItemViewModel');
    var NavigationViewModel = require('./ViewModels/NavigationViewModel');
    var NowViewingTabViewModel = require('./ViewModels/NowViewingTabViewModel');
    //var SearchPanelViewModel = require('./ViewModels/SearchPanelViewModel');

    SvgPathBindingHandler.register(knockout);
    KnockoutSanitizedHtmlBinding.register(knockout);
    registerCatalogViewModels();

    var application = new ApplicationViewModel();
    application.catalog.isLoading = true;

    application.error.addEventListener(function(e) {
        PopupMessageViewModel.open('ui', {
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

        var CatalogGroupViewModel = require('./ViewModels/CatalogGroupViewModel');
        var nds = application.catalog.group.findFirstItemByName('National Data Sets');

        var level1 = new CatalogGroupViewModel(application);
        level1.name = 'Level 1';
        nds.items.push(level1);

        var level2 = new CatalogGroupViewModel(application);
        level2.name = 'Level 2';
        level1.items.push(level2);

        var level3 = new CatalogGroupViewModel(application);
        level3.name = 'Level 3';
        level2.items.push(level3);

        AusGlobeViewer.create(application);

        var ui = document.getElementById('ui');

        knockout.bindingHandlers.embeddedComponent = {
            init : function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                var component = knockout.unwrap(valueAccessor());
                component.show(element);
                return { controlsDescendantBindings: true };
            },
            update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            }
        };

        BrandBarViewModel.create(ui, {
            name: 'NATIONAL<br/><strong>MAP</strong> <small>beta</small>',
            leftLogo: 'images/gov-brand.png'
        });
        //SearchPanelViewModel.create(ui, {});

        var menuBar = new MenuBarViewModel();
        menuBar.items.push(new MenuBarItemViewModel({
            label: 'Add data',
            tooltip: 'Add your own data to the map.',
            callback: function() {
                console.log('add');
            }
        }));
        menuBar.items.push(new MenuBarItemViewModel({
            label: 'Share',
            tooltip: 'Share your map with others.',
            callback: function() {
                console.log('share');
            }
        }));
        menuBar.items.push(new MenuBarItemViewModel({
            label: 'About',
            tooltip: 'About National Map.',
            href: 'http://nicta.github.io/nationalmap/public/info.html'
        }));
        menuBar.items.push(new MenuBarItemViewModel({
            label: 'Help',
            tooltip: 'Help using National Map.',
            href: 'http://nicta.github.io/nationalmap/public/faq.html'
        }));
        menuBar.show(ui);

        var locationBar = new LocationBarViewModel(application, document.getElementById('cesiumContainer'));
        locationBar.show(ui);

        var distanceLegend = new DistanceLegendViewModel(application);
        distanceLegend.show(ui);

        var navigation = new NavigationViewModel(application);
        navigation.show(ui);

        var explorer = new ExplorerPanelViewModel({});
        explorer.show(ui);

        explorer.addTab(new DataCatalogTabViewModel({
            catalog: application.catalog
        }));
        explorer.addTab(new NowViewingTabViewModel({
            nowViewing: application.nowViewing
        }));

        var searchTab = new NowViewingTabViewModel({
            nowViewing: application.nowViewing
        });
        searchTab.name = 'Search';
        explorer.addTab(searchTab);

        knockout.getObservable(explorer, 'isOpen').subscribe(function() {
            var cesiumContainer = document.getElementById('cesiumContainer');

            if (explorer.isOpen) {
                if (cesiumContainer.className.indexOf(' map-displaced') < 0) {
                    cesiumContainer.className += ' map-displaced';
                }
            } else {
                cesiumContainer.className = cesiumContainer.className.replace(' map-displaced', '');
            }
        });

        document.getElementById('loadingIndicator').style.display = 'none';
    });
}
