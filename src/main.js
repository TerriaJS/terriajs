"use strict";

/*global require*/

var start = true;

var PopupMessageViewModel = require('TerriaJS/ViewModels/PopupMessageViewModel');
var FeatureDetection = require('Cesium/Core/FeatureDetection');

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

    var BingMapsStyle = require('Cesium/Scene/BingMapsStyle');
    var defined = require('Cesium/Core/defined');
    var knockout = require('Cesium/ThirdParty/knockout');

    var AusGlobeViewer = require('TerriaJS/viewer/AusGlobeViewer');
    var registerKnockoutBindings = require('TerriaJS/Core/registerKnockoutBindings');

    var AddDataPanelViewModel = require('TerriaJS/ViewModels/AddDataPanelViewModel');
    var BaseMapViewModel = require('TerriaJS/ViewModels/BaseMapViewModel');
    var BingMapsSearchProviderViewModel = require('TerriaJS/ViewModels/BingMapsSearchProviderViewModel');
    var CatalogItemNameSearchProviderViewModel = require('TerriaJS/ViewModels/CatalogItemNameSearchProviderViewModel');
    var BrandBarViewModel = require('TerriaJS/ViewModels/BrandBarViewModel');
    var DataCatalogTabViewModel = require('TerriaJS/ViewModels/DataCatalogTabViewModel');
    var DistanceLegendViewModel = require('TerriaJS/ViewModels/DistanceLegendViewModel');
    var DragDropViewModel = require('TerriaJS/ViewModels/DragDropViewModel');
    var ExplorerPanelViewModel = require('TerriaJS/ViewModels/ExplorerPanelViewModel');
    var FeatureInfoPanelViewModel = require('TerriaJS/ViewModels/FeatureInfoPanelViewModel');
    var GazetteerSearchProviderViewModel = require('TerriaJS/ViewModels/GazetteerSearchProviderViewModel');
    var LocationBarViewModel = require('TerriaJS/ViewModels/LocationBarViewModel');
    var MenuBarViewModel = require('TerriaJS/ViewModels/MenuBarViewModel');
    var MenuBarItemViewModel = require('TerriaJS/ViewModels/MenuBarItemViewModel');
    var NavigationViewModel = require('TerriaJS/ViewModels/NavigationViewModel');
    var NowViewingTabViewModel = require('TerriaJS/ViewModels/NowViewingTabViewModel');
    var OnePanelOpenInTopRight = require('TerriaJS/ViewModels/OnePanelOpenInTopRight');
    var SearchTabViewModel = require('TerriaJS/ViewModels/SearchTabViewModel');
    var SettingsPanelViewModel = require('TerriaJS/ViewModels/SettingsPanelViewModel');
    var SharePopupViewModel = require('TerriaJS/ViewModels/SharePopupViewModel');
    var ToolsPanelViewModel = require('TerriaJS/ViewModels/ToolsPanelViewModel');

    var Application = require('TerriaJS/Models/Application');
    var ArcGisMapServerCatalogItem = require('TerriaJS/Models/ArcGisMapServerCatalogItem');
    var BingMapsCatalogItem = require('TerriaJS/Models/BingMapsCatalogItem');
    var CompositeCatalogItem = require('TerriaJS/Models/CompositeCatalogItem');
    var WebMapServiceCatalogItem = require('TerriaJS/Models/WebMapServiceCatalogItem');
    var registerCatalogMembers = require('TerriaJS/Models/registerCatalogMembers');
    var raiseErrorToUser = require('TerriaJS/Models/raiseErrorToUser');

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
            application.updateApplicationUrl(window.location).otherwise(function(e) {
                raiseErrorToUser(application, e);
            });
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
        naturalEarthII.url = 'http://geoserver.nationalmap.nicta.com.au/imagery/natural-earth-ii/wms';
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
        blackMarble.url = 'http://geoserver.nationalmap.nicta.com.au/imagery/nasa-black-marble/wms';
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

        // Create a "Tools" menu item, but only show it if "tools=1" (or similar) is present in the URL.
        var showToolsMenuItem = knockout.computed(function() {
            var toolsProperty = application.getUserProperty('tools');
            return defined(toolsProperty) && toolsProperty !== 'false' && toolsProperty !== 'no' && toolsProperty !== '0';
        });

        var toolsMenuItem = new MenuBarItemViewModel({
            visible: showToolsMenuItem(),
            label: 'Tools',
            tooltip: 'Advance National Map Tools.',
            callback: function() {
                ToolsPanelViewModel.open(ui, {
                    application: application
                });
            }
        });
        menuBar.items.push(toolsMenuItem);

        showToolsMenuItem.subscribe(function(newValue) {
            toolsMenuItem.visible = newValue;
        });

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
            href: 'help/About.html'
        }));
        menuBar.items.push(new MenuBarItemViewModel({
            label: 'Help',
            tooltip: 'Help using National Map.',
            href: 'help/Help.html'
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

        var featureInfo = new FeatureInfoPanelViewModel({
            application: application,
            container: ui,
            viewerElement: 'cesiumContainer'
        });

        // Make sure only one panel is open in the top right at any time.
        var onePanelOpenInTopRight = new OnePanelOpenInTopRight();
        onePanelOpenInTopRight.addPanel(settingsPanel);
        onePanelOpenInTopRight.addPanel(featureInfo);

        document.getElementById('loadingIndicator').style.display = 'none';
    });
}
