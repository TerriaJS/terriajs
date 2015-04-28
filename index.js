/**
 * @license
 * Copyright(c) 2012-2015 National ICT Australia Limited (NICTA).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

'use strict';

/*global require*/

var configuration = {
    terriaBaseUrl: 'build/TerriaJS',
    bingMapsKey: undefined,
    proxyBaseUrl: 'proxy/',
    conversionServiceBaseUrl: 'convert'
};

// Before requiring-in any other TerriaJS or Cesium code, tell TerriaJS where to find its static assets.
var initializeTerria = require('terriajs/lib/initializeTerria');
initializeTerria({
    baseUrl: configuration.terriaBaseUrl
});

// Check browser compatibility early on.
// A very old browser (e.g. Internet Explorer 8) will fail on requiring-in many of the modules below.
// 'ui' is the name of the DOM element that should contain the error popup if the browser is not compatible
var checkBrowserCompatibility = require('terriajs/lib/ViewModels/checkBrowserCompatibility');
checkBrowserCompatibility('ui');

var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var AusGlobeViewer = require('terriajs/lib/viewer/AusGlobeViewer');
var registerKnockoutBindings = require('terriajs/lib/Core/registerKnockoutBindings');
var corsProxy = require('terriajs/lib/Core/corsProxy');

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

var Terria = require('terriajs/lib/Models/Terria');
var OgrCatalogItem = require('terriajs/lib/Models/OgrCatalogItem');
var registerCatalogMembers = require('terriajs/lib/Models/registerCatalogMembers');
var raiseErrorToUser = require('terriajs/lib/Models/raiseErrorToUser');

// Configure the base URL for the proxy service used to work around CORS restrictions.
corsProxy.baseProxyUrl = configuration.proxyBaseUrl;

// Tell the OGR catalog item where to find its conversion service.  If you're not using OgrCatalogItem you can remove this.
OgrCatalogItem.conversionServiceBaseUrl = configuration.conversionServiceBaseUrl;

// Register custom Knockout.js bindings.  If you're not using the TerriaJS user interface, you can remove this.
registerKnockoutBindings();

// Register all types of catalog members in the core TerriaJS.  If you only want to register a subset of them
// (i.e. to reduce the size of your application if you don't actually use them all), feel free to copy a subset of
// the code in the registerCatalogMembers function here instead.
registerCatalogMembers();

// Construct the TerriaJS application, arrange to show errors to the user, and start it up.
var terria = new Terria();

terria.error.addEventListener(function(e) {
    PopupMessageViewModel.open('ui', {
        title: e.title,
        message: e.message
    });
});

terria.start({
    // If you don't want the user to be able to control catalog loading via the URL, remove the applicationUrl property below
    // as well as the call to "updateApplicationOnHashChange" further down.
    applicationUrl: window.location,
    configUrl: 'config.json'
}).otherwise(function(e) {
    raiseErrorToUser(terria, e);
}).always(function() {
    // Automatically update Terria (load new catalogs, etc.) when the hash part of the URL changes.
    updateApplicationOnHashChange(terria, window);

    // Create the map/globe.
    AusGlobeViewer.create(terria);

    // We'll put the entire user interface into a DOM element called 'ui'.
    var ui = document.getElementById('ui');

    // Create the various base map options.
    var australiaBaseMaps = createAustraliaBaseMapOptions(terria);
    var globalBaseMaps = createGlobalBaseMapOptions(terria, configuration.bingMapsKey);

    // Use the first global base map (Bing Maps Aerial with Labels) as the default one.
    terria.baseMap = globalBaseMaps[0].catalogItem;

    // Create the Settings / Map panel.
    var settingsPanel = SettingsPanelViewModel.create({
        container: ui,
        terria: terria,
        isVisible: false,
        baseMaps: australiaBaseMaps.concat(globalBaseMaps)
    });

    // Create the brand bar.
    BrandBarViewModel.create(ui, {
        elements: [
            '<a target="_blank" href="http://www.gov.au/"><img src="images/gov-brand.png" height="52" /></a>',
            '<div class="brand-bar-name"><a target="_blank" href="help/About.html">NATIONAL<br/><strong>MAP</strong> <small>beta</small></a></div>',
            '<a target="_blank" href="http://www.nicta.com.au"><img src="images/nicta.png" height="52" /></a>'
        ]
    });

    // Create the menu bar.
    MenuBarViewModel.create({
        container: ui,
        terria: terria,
        items: [
            // Add a Tools menu that only appears when "tools=1" is present in the URL.
            createToolsMenuItem(terria, ui),
            new MenuBarItemViewModel({
                label: 'Add data',
                tooltip: 'Add your own data to the map.',
                callback: function() {
                    AddDataPanelViewModel.open({
                        container: ui,
                        terria: terria
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
                        terria: terria
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
        terria: terria,
        mapElement: document.getElementById('cesiumContainer')
    });

    DistanceLegendViewModel.create({
        container: ui,
        terria: terria,
        mapElement: document.getElementById('cesiumContainer')
    });

    // Create the navigation controls.
    NavigationViewModel.create({
        container: ui,
        terria: terria
    });

    // Create the explorer panel.
    ExplorerPanelViewModel.create({
        container: ui,
        terria: terria,
        mapElementToDisplace: 'cesiumContainer',
        tabs: [
            new DataCatalogTabViewModel({
                catalog: terria.catalog
            }),
            new NowViewingTabViewModel({
                nowViewing: terria.nowViewing
            }),
            new SearchTabViewModel({
                searchProviders: [
                    new CatalogItemNameSearchProviderViewModel({
                        terria: terria
                    }),
                    new BingMapsSearchProviderViewModel({
                        terria: terria,
                        key: configuration.bingMapsKey
                    }),
                    new GazetteerSearchProviderViewModel({
                        terria: terria
                    })
                ]
            })
        ]
    });

    // Create the feature information popup.
    var featureInfoPanel = FeatureInfoPanelViewModel.create({
        container: ui,
        terria: terria
    });

    // Handle the user dragging/dropping files onto the application.
    DragDropViewModel.create({
        container: ui,
        terria: terria,
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
