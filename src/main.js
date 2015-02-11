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
    } else if (typeof Object.create === 'undefined') {
        PopupMessageViewModel.open('ui', {
            title : 'Very old browser detected',
            message : '\
    National Map requires a web browser with support for ECMAScript 5, a feature that has been available in all major browsers since 2009 but that does \
    not appear to be supported by your current browser.  Please update your browser \
    and try again.  For the best experience, we recommend \
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

    var BingMapsStyle = require('../third_party/cesium/Source/Scene/BingMapsStyle');
    var defined = require('../third_party/cesium/Source/Core/defined');
    var knockout = require('../third_party/cesium/Source/ThirdParty/knockout');

    var AusGlobeViewer = require('./viewer/AusGlobeViewer');
    var registerKnockoutBindings = require('./Core/registerKnockoutBindings');

    var AddDataPanelViewModel = require('./ViewModels/AddDataPanelViewModel');
    var BaseMapViewModel = require('./ViewModels/BaseMapViewModel');
    var BingMapsSearchProviderViewModel = require('./ViewModels/BingMapsSearchProviderViewModel');
    var CatalogItemNameSearchProviderViewModel = require('./ViewModels/CatalogItemNameSearchProviderViewModel');
    var BrandBarViewModel = require('./ViewModels/BrandBarViewModel');
    var DataCatalogTabViewModel = require('./ViewModels/DataCatalogTabViewModel');
    var DistanceLegendViewModel = require('./ViewModels/DistanceLegendViewModel');
    var DragDropViewModel = require('./ViewModels/DragDropViewModel');
    var ExplorerPanelViewModel = require('./ViewModels/ExplorerPanelViewModel');
    var GazetteerSearchProviderViewModel = require('./ViewModels/GazetteerSearchProviderViewModel');
    var LocationBarViewModel = require('./ViewModels/LocationBarViewModel');
    var MenuBarViewModel = require('./ViewModels/MenuBarViewModel');
    var MenuBarItemViewModel = require('./ViewModels/MenuBarItemViewModel');
    var NavigationViewModel = require('./ViewModels/NavigationViewModel');
    var NowViewingTabViewModel = require('./ViewModels/NowViewingTabViewModel');
    var SearchTabViewModel = require('./ViewModels/SearchTabViewModel');
    var SettingsPanelViewModel = require('./ViewModels/SettingsPanelViewModel');
    var SharePopupViewModel = require('./ViewModels/SharePopupViewModel');

    var Application = require('./Models/Application');
    var ArcGisMapServerCatalogItem = require('./Models/ArcGisMapServerCatalogItem');
    var BingMapsCatalogItem = require('./Models/BingMapsCatalogItem');
    var CompositeCatalogItem = require('./Models/CompositeCatalogItem');
    var WebMapServiceCatalogItem = require('./Models/WebMapServiceCatalogItem');
    var registerCatalogMembers = require('./Models/registerCatalogMembers');
    var raiseErrorToUser = require('./Models/raiseErrorToUser');

    registerKnockoutBindings();
    registerCatalogMembers();

    var application = new Application();
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
        useUrlHashAsInitSource: true
    }).otherwise(function(e) {
        raiseErrorToUser(application, e);
    }).always(function() {
        // Watch the hash portion of the URL.  If it changes, try to interpret as an init source.
        window.addEventListener("hashchange", function() {
            application.updateApplicationUrl(window.location);
        }, false);

        application.catalog.isLoading = false;

        // Start with "National Data Sets" open.
        var nds = application.catalog.group.findFirstItemByName('National Data Sets');
        if (defined(nds)) {
            nds.isOpen = true;
        }

        // Create the map/globe.
        AusGlobeViewer.create(application);

        var defaultBaseMap = new BingMapsCatalogItem(application);
        defaultBaseMap.name = 'Bing Maps Aerial with Labels';
        defaultBaseMap.mapStyle = BingMapsStyle.AERIAL_WITH_LABELS;
        defaultBaseMap.opacity = 1.0;

        application.baseMap = defaultBaseMap;

        // Create the user interface.
        var ui = document.getElementById('ui');

        BrandBarViewModel.create(ui, {
            elements: [
                '<a target="_blank" href="http://www.gov.au/"><img src="images/gov-brand.png" height="52" /></a>',
                '<div class="brand-bar-name"><a target="_blank" href="http://nicta.github.io/nationalmap/public/info.html">NATIONAL<br/><strong>MAP</strong> <small>beta</small></a></div>',
                '<a target="_blank" href="http://www.nicta.com.au"><img src="images/nicta.png" height="52" /></a>'
            ]
        });

        // Create the various base layer options.
        var naturalEarthII = new WebMapServiceCatalogItem(application);
        naturalEarthII.name = 'Natural Earth II';
        naturalEarthII.url = 'http://geoserver-nm.nicta.com.au/imagery/natural-earth-ii/wms';
        naturalEarthII.layers = 'natural-earth-ii:NE2_HR_LC_SR_W_DR';
        naturalEarthII.parameters = {
            tiled: true
        };
        naturalEarthII.opacity = 1.0;

        var australianTopoOverlay = new ArcGisMapServerCatalogItem(application);
        australianTopoOverlay.name = 'Australian Topography';
        australianTopoOverlay.url = 'http://www.ga.gov.au/gis/rest/services/topography/National_Map_Basemap_WM/MapServer';
        australianTopoOverlay.opacity = 1.0;

        var australianTopo = new CompositeCatalogItem(application, [naturalEarthII, australianTopoOverlay]);
        australianTopo.name = 'Australian Topography';

        var blackMarble = new WebMapServiceCatalogItem(application);
        blackMarble.name = 'NASA Black Marble';
        blackMarble.url = 'http://geoserver-nm.nicta.com.au/imagery/nasa-black-marble/wms';
        blackMarble.layers = 'nasa-black-marble:dnb_land_ocean_ice.2012.54000x27000_geo';
        blackMarble.parameters = {
            tiled: true
        };
        blackMarble.opacity = 1.0;

        var bingMapsAerial = new BingMapsCatalogItem(application);
        bingMapsAerial.name = 'Bing Maps Aerial';
        bingMapsAerial.mapStyle = BingMapsStyle.AERIAL;
        bingMapsAerial.opacity = 1.0;

        var bingMapsRoads = new BingMapsCatalogItem(application);
        bingMapsRoads.name = 'Bing Maps Roads';
        bingMapsRoads.mapStyle = BingMapsStyle.ROAD;
        bingMapsRoads.opacity = 1.0;

        var australianHydroOverlay = new ArcGisMapServerCatalogItem(application);
        australianHydroOverlay.name = 'Australian Hydrography';
        australianHydroOverlay.url = 'http://www.ga.gov.au/gis/rest/services/topography/AusHydro_WM/MapServer';
        australianHydroOverlay.opacity = 1.0;

        var australianHydro = new CompositeCatalogItem(application, [naturalEarthII, australianHydroOverlay]);
        australianHydro.name = 'Australian Hydrography';

        var settingsPanel = new SettingsPanelViewModel({
            application: application,
            isVisible: false
        });

        settingsPanel.baseMaps.push(new BaseMapViewModel({
            image: 'images/australian-topo.png',
            catalogItem: australianTopo,
        }));

        settingsPanel.baseMaps.push(new BaseMapViewModel({
            image: 'images/bing-aerial-labels.png',
            catalogItem: defaultBaseMap
        }));

        settingsPanel.baseMaps.push(new BaseMapViewModel({
            image: 'images/bing-aerial.png',
            catalogItem: bingMapsAerial,
        }));

        settingsPanel.baseMaps.push(new BaseMapViewModel({
            image: 'images/bing-maps-roads.png',
            catalogItem: bingMapsRoads,
        }));

        settingsPanel.baseMaps.push(new BaseMapViewModel({
            image: 'images/hydro.png',
            catalogItem: australianHydro,
        }));

        settingsPanel.baseMaps.push(new BaseMapViewModel({
            image: 'images/black-marble.png',
            catalogItem: blackMarble,
        }));

        settingsPanel.baseMaps.push(new BaseMapViewModel({
            image: 'images/natural-earth.png',
            catalogItem: naturalEarthII,
        }));

        settingsPanel.show(ui);

        var menuBar = new MenuBarViewModel();
        menuBar.items.push(new MenuBarItemViewModel({
            label: 'Add data',
            tooltip: 'Add your own data to the map.',
            callback: function() {
                AddDataPanelViewModel.open(ui, {
                    application: application
                });
            }
        }));
        menuBar.items.push(new MenuBarItemViewModel({
            label: 'Maps',
            tooltip: 'Change the map mode (2D/3D) and base map.',
            observableToToggle: knockout.getObservable(settingsPanel, 'isVisible')
        }));
        menuBar.items.push(new MenuBarItemViewModel({
            label: 'Share',
            tooltip: 'Share your map with others.',
            callback: function() {
                SharePopupViewModel.open(ui, {
                    application: application
                });
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

        var searchTab = new SearchTabViewModel(application);
        
        searchTab.searchProviders.push(new BingMapsSearchProviderViewModel({
            application: application
        }));
        searchTab.searchProviders.push(new GazetteerSearchProviderViewModel({
            application: application
        }));
        searchTab.searchProviders.push(new CatalogItemNameSearchProviderViewModel({
            application: application
        }));

        explorer.addTab(searchTab);

        DragDropViewModel.create(ui, {
            application: application,
            dropTarget: document
        });

        knockout.getObservable(explorer, 'isOpen').subscribe(function() {
            var cesiumContainer = document.getElementById('cesiumContainer');

            if (explorer.isOpen) {
                if (cesiumContainer.className.indexOf(' map-displaced') < 0) {
                    cesiumContainer.className += ' map-displaced';
                }
            } else {
                cesiumContainer.className = cesiumContainer.className.replace(' map-displaced', '');
            }

            // Resize Leaflet once the animation finishes.
            if (defined(application.leaflet)) {
                setTimeout(function() {
                    if (defined(application.leaflet)) {
                        application.leaflet.map.invalidateSize();
                    }
                }, 300);
            }

            application.currentViewer.notifyRepaintRequired();
        });

        document.getElementById('loadingIndicator').style.display = 'none';
    });
}
