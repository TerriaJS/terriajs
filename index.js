'use strict';

/*global require*/
var copyright = require('./lib/CopyrightModule'); // jshint ignore:line

// Check browser compatibility before doing anything else.
// A very old browser (e.g. Internet Explorer 8) will fail on requiring-in many of the modules below.
var checkBrowserCompatibility = require('terriajs/lib/ViewModels/checkBrowserCompatibility');
checkBrowserCompatibility('ui');

// Tell Cesium where to find its assets (images, CSS, Web Workers js files, etc.)
window.CESIUM_BASE_URL = 'build/Cesium/';

var defined = require('terriajs/Cesium/Source/Core/defined');
var knockout = require('terriajs/Cesium/Source/ThirdParty/knockout');

var AusGlobeViewer = require('terriajs/lib/viewer/AusGlobeViewer');
var registerKnockoutBindings = require('terriajs/lib/Core/registerKnockoutBindings');

var AddDataPanelViewModel = require('terriajs/lib/ViewModels/AddDataPanelViewModel');
var BingMapsSearchProviderViewModel = require('terriajs/lib/ViewModels/BingMapsSearchProviderViewModel');
var BrandBarViewModel = require('terriajs/lib/ViewModels/BrandBarViewModel');
var CatalogItemNameSearchProviderViewModel = require('terriajs/lib/ViewModels/CatalogItemNameSearchProviderViewModel');
var createAustraliaBaseMapOptions = require('terriajs/lib/ViewModels/createAustraliaBaseMapOptions');
var createGlobalBaseMapOptions = require('terriajs/lib/ViewModels/createGlobalBaseMapOptions');
var createToolsMenuItem = require('terriajs/lib/ViewModels/createToolsMenuItem');
var DataCatalogTabViewModel = require('terriajs/lib/ViewModels/DataCatalogTabViewModel');
var DistanceLegendViewModel = require('terriajs/lib/ViewModels/DistanceLegendViewModel');
var DragDropViewModel = require('terriajs/lib/ViewModels/DragDropViewModel');
var ExplorerPanelViewModel = require('terriajs/lib/ViewModels/ExplorerPanelViewModel');
var FeatureInfoPanelViewModel = require('terriajs/lib/ViewModels/FeatureInfoPanelViewModel');
var GazetteerSearchProviderViewModel = require('terriajs/lib/ViewModels/GazetteerSearchProviderViewModel');
var LocationBarViewModel = require('terriajs/lib/ViewModels/LocationBarViewModel');
var MenuBarItemViewModel = require('terriajs/lib/ViewModels/MenuBarItemViewModel');
var MenuBarViewModel = require('terriajs/lib/ViewModels/MenuBarViewModel');
var MutuallyExclusivePanels = require('terriajs/lib/ViewModels/MutuallyExclusivePanels');
var NavigationViewModel = require('terriajs/lib/ViewModels/NavigationViewModel');
var NowViewingTabViewModel = require('terriajs/lib/ViewModels/NowViewingTabViewModel');
var PopupMessageViewModel = require('terriajs/lib/ViewModels/PopupMessageViewModel');
var SearchTabViewModel = require('terriajs/lib/ViewModels/SearchTabViewModel');
var SettingsPanelViewModel = require('terriajs/lib/ViewModels/SettingsPanelViewModel');
var SharePopupViewModel = require('terriajs/lib/ViewModels/SharePopupViewModel');
var updateApplicationOnHashChange = require('terriajs/lib/ViewModels/updateApplicationOnHashChange');

var Application = require('terriajs/lib/Models/Application');
var registerCatalogMembers = require('terriajs/lib/Models/registerCatalogMembers');
var raiseErrorToUser = require('terriajs/lib/Models/raiseErrorToUser');

// Register custom Knockout.js bindings.  If you're not using the TerriaJS user interface, you can remove this.
registerKnockoutBindings();

// Register all types of catalog members in the core TerriaJS.  If you only want to register a subset of them
// (i.e. to reduce the size of your application if you don't actually use them all), feel free to copy a subset of
// the code in the registerCatalogMembers function here instead.
registerCatalogMembers();

// Construct the TerriaJS application, arrange to show errors to the user, and start it up.
var application = new Application();

application.error.addEventListener(function(e) {
    PopupMessageViewModel.open('ui', {
        title: e.title,
        message: e.message
    });
});

application.start({
    // If you don't want the user to be able to control catalog loading via the URL, remove the applicationUrl property below
    // as well as the call to "updateApplicationOnHashChange" further down.
    applicationUrl: window.location,
    configUrl: 'config.json'
}).otherwise(function(e) {
    raiseErrorToUser(application, e);
}).always(function() {
    // Automatically update the application (load new catalogs, etc.) when the hash part of the URL changes.
    updateApplicationOnHashChange(application, window);

    // Create the map/globe.
    AusGlobeViewer.create(application);

    // We'll put the entire user interface into a DOM element called 'ui'.
    var ui = document.getElementById('ui');

    // Create the various base map options.
    var australiaBaseMaps = createAustraliaBaseMapOptions(application);
    var globalBaseMaps = createGlobalBaseMapOptions(application);

    // Use the first global base map (Bing Maps Aerial with Labels) as the default one.
    application.baseMap = globalBaseMaps[0].catalogItem;

    // Create the Settings / Map panel.
    var settingsPanel = SettingsPanelViewModel.create({
        container: ui,
        application: application,
        isVisible: false,
        baseMaps: australiaBaseMaps.concat(globalBaseMaps)
    });

    // Create the brand bar.
    BrandBarViewModel.create(ui, {
        elements: [
            '<a target="_blank" href="http://www.gov.au/"><img src="images/gov-brand.png" height="52" /></a>',
            '<div class="brand-bar-name"><a target="_blank" href="http://nicta.github.io/nationalmap/public/info.html">NATIONAL<br/><strong>MAP</strong> <small>beta</small></a></div>',
            '<a target="_blank" href="http://www.nicta.com.au"><img src="images/nicta.png" height="52" /></a>'
        ]
    });

    // Create the menu bar.
    MenuBarViewModel.create({
        container: ui,
        application: application,
        items: [
            // Add a Tools menu that only appears when "tools=1" is present in the URL.
            createToolsMenuItem(application, ui),
            new MenuBarItemViewModel({
                label: 'Add data',
                tooltip: 'Add your own data to the map.',
                callback: function() {
                    AddDataPanelViewModel.open({
                        container: ui,
                        application: application
                    });
                }
            }),
            new MenuBarItemViewModel({
                label: 'Maps',
                tooltip: 'Change the map mode (2D/3D) and base map.',
                observableToToggle: knockout.getObservable(settingsPanel, 'isVisible')
            }),
            new MenuBarItemViewModel({
                label: 'Share',
                tooltip: 'Share your map with others.',
                callback: function() {
                    SharePopupViewModel.open({
                        container: ui,
                        application: application
                    });
                }
            }),
            new MenuBarItemViewModel({
                label: 'About',
                tooltip: 'About National Map.',
                href: 'help/About.html'
            }),
            new MenuBarItemViewModel({
                label: 'Help',
                tooltip: 'Help using National Map.',
                href: 'help/Help.html'
            })
        ]
    });

    // Create the lat/lon/elev and distance widgets.
    LocationBarViewModel.create({
        container: ui,
        application: application,
        mapElement: document.getElementById('cesiumContainer')
    });

    DistanceLegendViewModel.create({
        container: ui,
        application: application,
        mapElement: document.getElementById('cesiumContainer')
    });

    // Create the navigation controls.
    NavigationViewModel.create({
        container: ui,
        application: application
    });

    // Create the explorer panel.
    var explorer = ExplorerPanelViewModel.create({
        container: ui,
        application: application,
        mapElementToDisplace: 'cesiumContainer',
        tabs: [
            new DataCatalogTabViewModel({
                catalog: application.catalog
            }),
            new NowViewingTabViewModel({
                nowViewing: application.nowViewing
            }),
            new SearchTabViewModel({
                searchProviders: [
                    new BingMapsSearchProviderViewModel({
                        application: application
                    }),
                    new GazetteerSearchProviderViewModel({
                        application: application
                    }),
                    new CatalogItemNameSearchProviderViewModel({
                        application: application
                    })
                ]
            })
        ]
    });

    // Create the feature information popup.
    var featureInfoPanel = FeatureInfoPanelViewModel.create({
        container: ui,
        application: application
    });

    // Handle the user dragging/dropping files onto the application.
    DragDropViewModel.create({
        container: ui,
        application: application,
        dropTarget: document,
        allowDropInitFiles: true,
        allowDropDataFiles: true
    });

    // Make sure only one panel is open in the top right at any time.
    MutuallyExclusivePanels.create({
        panels: [
            settingsPanel,
            featureInfoPanel
        ]
    });

    document.getElementById('loadingIndicator').style.display = 'none';
});
