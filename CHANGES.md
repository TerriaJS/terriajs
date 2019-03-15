Change Log
==========

### Next Release

* Highlight polygon and polyline features.
* Replace `getUniqueValues` with `lodash.uniq`
* Fixed a bug where the 3D globe would not immediately refresh when toggling between the "Terrain" and "Smooth" viewer modes.

### v7.0.2

* Fixed a bug that prevented billboard images from working on the 2D map.
* Implemented "Zoom To" support for KML, CZML, and other vector data sources.
* Upgraded to Cesium v1.55.

### v7.0.1

* Breaking Changes:
  * TerriaJS no longer supports Internet Explorer 9 or 10.
  * An application-level polyfill suite is now highly recommended, and it is required for Internet Explorer 11 compatibility. The easiest approach is to add `<script src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>` to the `<head>` element of your application's HTML page, which will deliver a polyfill suite tailored to the end-user's browser.
  * TerriaJS now requires Node.js v8.0 or later.
  * TerriaJS now requires Webpack v4.0 or later.
  * TerriaJS now uses Gulp v4.0. If you have Gulp 3 installed globally, you'll need to use `npm run gulp` to run TerriaJS gulp tasks, or upgrade your global Gulp to v4 with `npm install -g gulp@4`.
  * TerriaJS now uses Babel v7.0.
  * Removed `UrthecastCatalogItem`, `UrthecastCatalogGroup`, and `registerUrthcastCatalogItems`. The Urthecast functionality was dependent on an npm package that hadn't been updated in three years and had potential security vulnerabilities. Please [let us know](https://gitter.im/TerriaJS/terriajs) if you were using this functionality.

### v6.5.0

* Add support for rendering Mapbox Vector Tiles (MVT) layers. Currently, polygons are the only supported geometry type, and all polygons are drawn with the same outline and fill colors.
* `wwwroot/data/regionMapping.json` is now the default region mapping file (rather than a file provided by TerriaMap), and needs to be explicitly overridden by a `regionMappingDefinitionsUrl` setting in config.json.

### v6.4.0

* The Feature Info panel can now be moved by clicking and dragging it.
* The map tool buttons are now arranged horizontally instead of vertically on small-screen mobile devices.
* When using a Web Map Service (WMS) catalog item with the `linkedWcsUrl` and `linkedWcsCoverage` properties, we now pass the selected WMS style to the Web Coverage Service (WCS) so that it can optionally return different information based on the selected style.
* Added `stationIdWhitelist` and `stationIdBlacklist` properties to `SensorObservationServiceCatalogItem` to allow filtering certain monitoring stations in/out.
* Fixed a bug that caused a crash when attempting to use a `style` attribute on an `<a>` tag in Markdown+HTML strings such as feature info templates.
* Fixed a bug that displaced the chart dropdown list on mobile Safari.

### v6.3.7

* Upgraded to Cesium v1.53.

### v6.3.6

* Dragging/dropping files now displays a more subtle notification rather than opening the large Add Data / My Data panel.
* The `sendFeedback` function can now be used to send additional information if the server is configured to receive it (i.e. `devserverconfig.json`).
* Made custom feedback controls stay in the lower-right corner of the map.
* Improved the look of the toolbar icons in the top right, and added an icon for the About page.

### v6.3.5

* Changed the title text for the new button next to "Add Data" on the workbench to "Load local/web data".
* Fixed a bug that caused the area to the right of the Terria log on the 2D map to be registered as a click on the logo instead of a click on the map.
* Fixed a bug that caused the standard "Give Feedback" button to fail to open the feedback panel.
* Swapped the positions of the group expand/collapse icon and the "Remove from catalogue" icon on the My Data panel, for more consistent alignment.
* Made notifications honor the `width` and `height` properties. Previously, these values were ignored.

### v6.3.4

* Added the ability to add custom components to the feedback area (lower right) of the user interface.

### v6.3.3

* Upgraded to Cesium v1.51.

### v6.3.2

* Added "filterByProcedures" property to "sos" item (default: true). When false, the list of procedures is not passed as a filter to GetFeatureOfInterest request, which works better for BoM Water Data Online services.

### v6.3.1

* Fixed a bug that caused the compass control to be misaligned in Internet Explorer 11.

### v6.3.0

* Changed the "My Data" interface to be much more intuitive and tweaked the visual style of the catalog.
* Added `CartoMapCatalogItem` to connect to layers using the [Carto Maps API](https://carto.com/developers/maps-api/).

## v6.2.3

* Made it possible to configure the compass control's colors using CSS.

### v6.2.2

* Removed the Terria logo from the preview map and made the credit there smaller.
* Fall back to the style name in the workbench styles dropdown when no title is given for a style in WMS GetCapabilities.

### v6.2.1

* We now use Cesium Ion for the Bing Maps basemaps, unless a `bingMapsKey` is provided in [config.json](https://docs.terria.io/guide/customizing/client-side-config/#parameters). You can control this behavior with the `useCesiumIonBingImagery` property. Please note that if a `bingMapsKey` is not provided, the Bing Maps geocoder will always return no results.
* Added a Terria logo in the lower left of the map. It can be disabled by setting `"hideTerriaLogo": true` in `config.json`.
* Improved the credits display on the 2D map to be more similar to the 3D credits.
* Fixed a bug that caused some legends to be missing or incomplete in Apple Safari.

### v6.2.0

* Added a simple WCS "clip and ship" functionality for WMS layers with corresponding a WCS endpoint and coverage.
* Fixed problems canceling drag-and-drop when using some web browsers.
* Fixed a bug that created a time period where no data is shown at the end of a time-varying CSV.
* Fixed a bug that could cause endless tile requests with certain types of incorrect server responses.
* Fixed a bug that could cause endless region tile requests when loading a CSV with a time column where none of the column values could actually be interpreted as a time.
* Added automatic retry with jittered, exponential backoff for tile requests that result in a 5xx HTTP status code. This is especially useful for servers that return 503 or 504 under load. Previously, TerriaJS would frequently disable the layer and hit the user with an error message when accessing such servers.
* Updated British National Grid transform in `Proj4Definitions` to a more accurate (~2 m) 7 parameter version https://epsg.io/27700.
* Distinguished between 3D Terrain and 3D Smooth in share links and init files.
* Upgraded to Cesium v1.50.

### v6.1.4

* Fixed a bug that could cause the workbench to appear narrower than expected on some systems, and the map to be off-center when collapsing the workbench on all systems.

### v6.1.3

* When clicking a `Split` button on the workbench, the new catalog item will no longer be attached to the timeline even if the original was. This avoids a confusing situation where both catalog items would be locked to the same time.
* Added KMZ to the whitelisted formats for `MagdaCatalogItem`.
* Fixed a bug that caused a crash when switching to 2D with vector data already on the map, including when visiting a share link with vector data when the map ends up being 2D.
* The "Hide Workbench" button is now attached to the side of the Workbench, instead of on the opposite side of the screen from it.

### v6.1.2

* Fixed a bug that prevented `BingMapsSearchProviderViewModel` and other uses of `loadJsonp` from working correctly.

### v6.1.1

* Upgraded to terriajs-server v2.7.4.

### v6.1.0

* The previous default terrain provider, STK World Terrain, has been deprecated by its provider. *To continue using terrain in your deployed applications, you _must_ obtain a Cesium Ion key and add it to `config.json`*. See https://cesium.com/ to create an Ion account. New options are available in `config.json` to configure terrain from Cesium Ion or from another source. See https://terria.io/Documentation/guide/customizing/client-side-config/#parameters for configuration details.
* Upgraded to Cesium v1.48.
* Added `Cesium3DTilesCatalogItem` for visualizing [Cesium 3D Tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles) datasets.
* Added `IonImageryCatalogItem` for accessing imagery assets on [Cesium Ion](https://cesium.com/).
* Added support for Cesium Ion terrain assets to `CesiumTerrainProvider`. To use an asset from Ion, specify the `ionAssetId` and optionally the `ionAccessToken` and `ionServer` properties instead of specifying a `url`.
* Fixed a bug that could cause legends to be missing from `WebMapServiceCatalogItems` that had `isEnabled` set to true.

### v6.0.5

* Added `rel="noreferrer noopener"` to all `target="_blank"` links. This prevents the target page from being able to navigate the source tab to a new page.
* Fixed a bug that caused the order of items on the Workbench to change when visiting a share link.

### v6.0.4

* Changed `CesiumSelectionIndicator` to no longer use Knockout binding. This will avoid a problem in some environments, such as when a Content Security Policy (CSP) is in place.

### v6.0.3

* Fixed a bug that prevented users from being able to enter coordinates directly into catalog function point parameter fields.

### v6.0.2

* Fixed a bug that prevented interaction with the 3D map when the splitter was active.

### v6.0.1

* Added `parameters` property to `ArcGisMapServerCatalogItem`, allowing arbitrary parameters to be passed in tile and feature info requests.

### v6.0.0

* Breaking Changes:
   * An application-level polyfill suite is now required for Internet Explorer 9 and 10 compatibility. The easiest approach is to add `<script src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>` to the `<head>` element of your application's HTML page.
   * In TerriaJS v7.0.0 (the _next_ major release), a polyfill suite may be required for Internet Explorer 11 as well. Adopting the approach above now will ensure you don't need to worry about it then.
* Overhauled support for printing. There is now a Print button on the Share panel that will provide a much better printable form of the map than the browser's built-in print feature. If a user uses the browser's print button instead, a message at the top will suggest using the TerriaJS Print feature and open the Share panel. Calling `window.print` (e.g. on a TerriaJS instance inside an iframe) will invoke the new TerriaJS print feature directly.
* Fixed a bug that caused `Leaflet.captureScreenshot` to show all layers on both sides even with the splitter active.
* Fixed a bug that prevented some vector features from appearing in `Leaflet.captureScreenshot`.
* Added ability to move the splitter thumb position vertically so that users can move it to prevent occlusions.
* Added `TerriaJsonCatalogFunction`. This catalog function allows an arbitrary HTTP GET to be invoked with user-provided parameters and return TerriaJS catalog JSON.
* Fixed a bug that could cause the feature info panel to sometimes be nearly transparent in Internet Explorer 11.
* Fixed a bug that caused an expanded preview chart's workbench item to erroneously show the date picker.
* Updated `MagdaCatalogItem` to match Magda project

### 5.7.0

* Added `MagdaCatalogItem` to load details of a catalog item from [Magda](https://github.com/TerriaJS/magda).
* Fixed a bug that could cause a time-dynamic WMS layer to fail to ever show up on the map if the initial time on the timeline was outside the intervals where the layer had data.
* Fixed a bug which could cause a crash during load from share link when the layer default is to not `useOwnClock` but the share link has `useOwnClock` set.
* Fixed an issue that caused a 'This data source is already shown' error in particular circumstances.

### 5.6.4

* Fixed a bug causing an error message when adding tabular data to the workbench before it was loaded.

### 5.6.3

* Display of Lat Lon changed from 3 deciml places to 5 decimal places - just over 1m precision at equator.
* Fixed a bug that caused the timeline to appear when changing the time on the workbench for a layer not attached to the timeline.
* The workbench date/time picker is now available for time varying point and region CSVs.
* Fixed a bug that caused the workbench date picker controls to disappear when the item was attached to the timeline and the timeline's current time was outside the valid range for the item.

### 5.6.2

* Renamed search marker to location marker.
* Added the clicked coordinates to the bottom of the feature info panel. Clicking the marker icon will cause the location to be indicated on the map.
* The location marker is now included in shared map views.
* Fixed a bug that could cause split WMS layers to show the incorrect layer data for the date shown in the workbench.
* Refactored current time handling for `CatalogItem` to reduce the complexity and number of duplicated current time states.
* Fixed feature info updating when the time is changed from the workbench for `TableCatalogItem`.
* Change the workbench catalog item date picker so that updating the date does not disable the timeslider.
* Fix a bug that meant that, when the current time was updated on an `ImageryCatalogItem` while the layer wasn't shown, the old time was still shown when the layer was re-enabled.
* Added `{{terria.currentTime}}` to feature info template.
* Added a way to format times within a feature info tempate. E.g. `{{#terria.formatDateTime}}{"format": "dd-mm-yyyy HH:MM:ss"}{{terria.currentTime}}{{/terria.formatDateTime}}`.
* Fixed a bug that caused the selection indicator to float strangely when visiting a share link with a selected feature.
* Fixed a bug that caused a region to be selected even when clicking on a hole in that region.
* Fixed a bug that prevented the selection indicator from following moving features on the 2D map.
* Fixed a bug that caused Leaflet to stop rendering further points in a layer and throw errors when calculating extent when one point had invalid characters in the latitude or longitude field.
* We now default to `autoPlay: false` if it's not specified in `config.json`.
* Changed search box placeholders to more precisely reflect their functionality.
* CartoDB basemaps are now always loaded over HTTPS.

### 5.6.1

* Fixed a bug that could cause the workbench UI to hang when toggling concepts, particularly for an `SdmxJsonCatalogItem`.
* Added previous and next buttons to workbench catalog item date picker.

### 5.6.0

* Upgraded to Cesium 1.41.

### 5.5.7

* Added support for using tokens to access WMS layers, particularly using the WMS interface to ArcGIS servers.

### 5.5.6

* Tweaked the sizing of the feature info panel.
* Fixed a bug that caused `ArcGisMapServerCatalogItem` to always use the server's single fused map cache, if available. Now, if the `layers` property is specified, we request individual dynamic layers and ignore the fused map cache.

### 5.5.5

* Fixed a bug that caused the feature info panel to stop working after clicking on a location search marker.
* Added support for ArcGIS tokens on the 2D map. Previously, tokens only worked reliably in 3D.
* Improved handling of tile errors, making it more consistent between 2D and 3D.
* Fixed a bug that prevented the Add Data button from working Internet Explorer 9 unless the DevTools were also open.
* Improved the sizing of the feature info panel so it is less likely to completely obscure the map.

### 5.5.4

* Fixed a serious bug that prevented opening the Data Catalog in Internet Explorer.
* Fixed some problems with the Terria Spatial Analytics `CatalogFunctions`.

### 5.5.3

* Fixed a bug in SDMX-JSON when using `cannotSum`.

### 5.5.2

* Deprecated SDMX-JSON catalog items' `cannotDisplayPercentMap` in favour of `cannotSum`.
* Updated `cannotSum` so that it does not display a total in some cases, as well as suppressing the regional-percentage checkbox.  `cannotSum` can be either a mapping of concept ids to the values that prevent summing, or simply `true` to always prevent summing.
* Fixed a bug that caused an error when Splitting a layer that does not have a `clock`.

### 5.5.1

* Added `cannotDisplayPercentMap` to SDMX-JSON catalog items, to optionally turn off the "display as a percentage of regional total" checkbox when the data is not a count (eg. a rate or an average).

### 5.5.0

* Added the ability to split the screen into a left-side and right-side, and show raster and region mapped layers on only one side of the splitter.
* Added the ability to use a tabbed catalog in the explorer panel on desktop site. Setting `tabbedCatalog` parameter to `true` in `config.json` causes top-level groups in the catalog to list items in separate explorer panel tabs.
* Added the ability to use vector tile properties in feature info templates when using region mapping (data row attributes will overwrite vector tile properties with the same name)
* Properties available in feature info templates are now JSON parsed and replaced by their javascript object if they start with `[` or `{` and parse successfully
* Decreased flickering of time-varying region mapped layers by pre-rendering the next time interval.
* Fixed a bug in `WebMapServiceCatalogItem` that could cause a WMS time time dimension to be interpreted incorrectly if it was specified only using dates (not times) and with a periodicity of less than a day.

### 5.4.5

* Improved behaviour of SDMX-JSON items when no data is available.

### 5.4.4

* Added support for specifying namespaced layer names in the `WebMapServiceCatalogItem` `layers` property.
* Made TerriaJS tolerant of XML/HTML inside text elements in WMS GetCapabilities without being properly wrapped in `CDATA`.

### 5.4.3

* Fixed a build problem on case-sensitive file systems (e.g. most Linux systems).

### 5.4.2

* We no longer show the Zoom To button on the workbench when there is no rectangle to zoom to.

### 5.4.1

* Fixed a bug when sharing SDMX-JSON catalog items.
* Improved display of "Add Data" panel on small screens when Feedback and Feature Info panels are open.
* Added "search in data catalog" link to mobile search.
* Added a button to automatically copy share url into clipboard in share panel.
* Added `initFragmentPaths` property to the `parameters` section of `config.json`.  It can be used to specify an array of base paths for resolving init fragments in the URL.
* Modified `CkanCatalogItem` to exclude files that advertise themselves as KML files but have the file extension .ZIP.
* Removed "View full size image" link on the share panel.  Chrome 60 removed the ability to navigate to a data URI, and other browsers are expected to follow this lead.

### 5.4.0

* Breaking change: removed some old types that haven't been used since the new React-based user interface in v4.0.0, specifically `KnockoutHammerBinding`, `KnockoutMarkdownBinding`, `PopupMessageConfirmationViewModel`, `PopupMessageViewModel`, and `PopupViewModel`.
* Added the ability to use tokens from terriajs-server for layers requiring ESRI tokens.
* Catalog group items are now sorted by their in-catalog name

### 5.3.0

* Added the ability to use the analytics region picker with vector tile region mapping by specifiying a WMS server & layer for analytics only.
* Updated the client side validation to use the server-provided file size limit when drag/dropping a file requiring the conversion service.
* `zoomOnEnable` now works even for a catalog item that is initially enabled in the catalog.  Previously, it only worked for catalog items enabled via the user interface or otherwise outside of the load process.
* Added `initialTimeSource` property to `CsvCatalogItem` so it is possible to specify the value of the animation timeline at start from init files.
* Added to documentation for customizing data appearance.
* Added `CatalogShortcut` for creating tool items for linking to a `CatalogItem`.
* Renamed `ViewState.viewCatalogItem()` to `viewCatalogMember` to reflect that it can be used for all `CatalogMembers`, not just `CatalogItems`.
* Fixed a bug that could cause a crash when switching to 2D when the `initialView` was just a `Rectangle` instead of a `CameraView`.
* Fixed a bug that caused multiple layers with generated, gradient legends to all show the same legend on the Workbench.

### 5.2.11

* Pinned `urijs` to v1.18.10 to work around a breaking change in v1.18.11.

### 5.2.10

* Improved the conversion of Esri polygons to GeoJSON by `featureDataToGeoJson`.  It now correctly handles polygons with holes and with multiple outer rings.
* Added some fields to the dataset info page for `CkanCatalogItem`.
* Fixed a bug that could cause some layers, especially the Bing Maps basemap, to occasionally be missing from the 2D map.
* Fixed a bug that could cause the selected time to move to the end time when sharing a map with a time-dynamic layer.

### 5.2.9

* A catalog item's `cacheDuration` property now takes precedence over the cache duration specified by the code.  Previously, the `cacheDuration` would only override the default duration (2 weeks).

### 5.2.8

* Added option to expand the HTML embed code and toggle URL shorting for the share link.
* The Share feature now includes the current time selected on the timeline, so that anyone visiting a share link will see the map at the intended time.

### 5.2.7

* Added the Latitude and Longitude to the filename for the Feature Information file download.
* Added the time to the timeline labels when zoomed in to a single day. Previously, the label sometimes only showed the date.

### 5.2.6

* Added the ability to disable the conversion service so that no user data is sent outside of the client by setting `conversionServiceBaseUrl` to `false` in the `parameters` section of `config.json`.
* Added the ability to disable the location button by setting `disableMyLocation` to `true` in the `parameters` section of `config.json`.
* Fixed a bug that caused the share functionality to fail (both screenshot and share link) in 2d mode.
* Fixed a bug with explicitly styled enum columns in Internet Explorer.
* Fixed a bug that caused the selected column in a csv to be the second column when a time column is present.

### 5.2.5

* Fixed a bug with `forceProxy: true` which meant that vector tiles would try, and fail, to load over the proxy.
* Added documentation for customizing data appearance, and folded in existing but orphaned documentation for creating feature info templates.
* Changed the LocateMe button so that it toggles and continuously updates the location when Augmented Reality is enabled.
* Added the ability to set SDMX-JSON region names from a region type dimension, using a Mustache template. This was required so regions can be mapped to specific years, even if not specified by the SDMX-JSON server.
* Added `viewermode` to the users persistent local storage to remember the last `ViewerMode` used.
* Added the ability to customize the preamble text on the feedback form ("We would love to hear from you!") by setting `feedbackPreamble` in the `parameters` section of `config.json`.

### 5.2.4

* Fixed a bug that prevented error messages, such as when a dataset fails to load, from being shown to the user. Instead, the errors were silently ignored.

### 5.2.3

* Fixed a bug that gave expanded Sensor Observation Service charts poor names.
* Fixed a bug that prevented some table-based datasets from loading.

### 5.2.2

* Fixed download of selected dataset (as csv) so that quotes are handled in accordance with https://tools.ietf.org/html/rfc4180. As a result, more such downloads can be directly re-loaded in Terria by dragging and dropping them.

### 5.2.1

* Changed the default opacity for points from CSV files without a value column to 1.0 (previously it was 0.6).  This is a workaround for a Cesium bug (https://github.com/AnalyticalGraphicsInc/cesium/issues/5307) but really a better choice anyway.
* Fixed a bug which meant non-standard properties of some table data sources (eg. csv, SOS, SDMX-JSON) were missing in the feature info panel, because of a breaking change in Cesium 1.33.

### 5.2.0

* Fixed a bug that caused layer disclaimers to fail to appear when the layer was enabled via a share link.  Since the user was unable to accept the disclaimer, the layer also failed to appear.
* Added `AugmentedVirtuality` (user facing feature name Augmented Reality) to allow users to use their mobile device's orientation to set the camera view.
* Added the `showFeaturesAtAllTimes` option to Sensor Observation Service items. This improves the user experience if the server returns
  some features starting in 1990, say, and some starting in 1995, so that the latter still appear (as grey points with no data) in 1990.
* Fixed a bug that prevented preview charts in the feature info panel from updating when the user changed the Sensor Observation Service frequency.
* Fixed a bug that allowed the user to de-select all the display choices for Sensor Observation Service items.
* Improved the appearance of charts where all the y-values are null. (It now shows "No preview available".)
* Upgraded to Leaflet 1.0.3 for the 2D and preview maps.
* Upgraded to [Cesium 1.33](https://github.com/AnalyticalGraphicsInc/cesium/blob/1.33/CHANGES.md) for the 3D view.

### 5.1.1

* Fixed a bug that caused an 'added' and a 'shown' event for "Unnamed Item" to be logged to Google Analytics when previewing an item in the catalog.
* Added a 'preview' Google Analytics event when a catalog item is shown on the preview map in the catalog.
* Fixed a bug that prevented csv files with missing dates from loading.
* Fixed a bug that could cause an error when adding a layer without previewing it first.

### 5.1.0

* Fixed a bug that prevented `WebMapServiceCatalogItem` from acting as a time-dynamic layer when the time dimension was inherited from a parent layer.
* `WebMapServiceCatalogItem` now supports WMS 1.1.1 style dimensions (with an `Extent` element) in addition to the 1.3.0 style (`Dimension` only).
* `WebMapServiceCatalogItem` now passes dates only (rather than dates and times) to the server when the TIME dimension uses the `start/stop/period` form, `start` is a date only, and `period` does not include hours, minutes, or seconds.
* `WebMapServiceCatalogItem` now supports years and months (in addition to days, hours, minutes, and seconds) in the period specified of a TIME dimension.
* `WebMapServiceCatalogItem` now ignores [leap seconds](https://en.wikipedia.org/wiki/Leap_second) when evaluating ISO8601 periods in a time dimension.  As a result, 2 hours after `2016-06-30T23:00:00Z` is now `2016-07-01T01:00:00Z` instead of `2016-07-01T00:59:59Z` even though a leap second at the end of June 2016 makes that technically 2 hours and 1 second.  We expect that this is more likely to align with the expectations of WMS server software.
* Added option to specify `mobileDefaultViewerMode` in the `parameters` section of `config.json` to specify the default view mode when running on a mobile platform.
* Added support for `itemProperties` to `CswCatalogGroup`.
* Added `terria.urlEncode` function for use in feature info templates.
* Fixed a layout problem that caused the coordinates on the location bar to be displayed below the bar itself in Internet Explorer 11.
* Updated syntax to remove deprecation warnings with React version 15.5.

### 5.0.1

* Breaking changes:
  * Starting with this release, TerriaJS is meant to be built with Webpack 2.  The best way to upgrade your application is to merge from [TerriaMap](https://github.com/TerriaJS/TerriaMap).  If you run into trouble, post a message on the [TerriaJS forum](https://groups.google.com/forum/#!forum/terriajs).
  * Removed the following previously-deprecated modules: `registerKnockoutBindings` (no replacement), `AsyncFunctionResultCatalogItem` (now `ResultPendingCatalogItem`), `PlacesLikeMeFunction` (now `PlacesLikeMeCatalogFunction`), `SpatialDetailingFunction` (now `SpatialDetailingCatalogFunction`), and `WhyAmISpecialFunction` (now `WhyAmISpecialCatalogFunction`).
  * Removed `lib/Sass/StandardUserInterface.scss`.  It is no longer necessary to include this in your application.
  * Removed the previously-deprecated third pararameter, `getColorCallback`, of `DisplayVariablesConcept`.  Pass it inside the `options` parameter instead.
  * Removed the following previously-deprecated properties from `TableColumn`: `indicesIntoUniqueValues` (use `uniqueValues`), `indicesOrValues` (use `values`), `indicesOrNumericalValues` (use `uniqueValues` or `numericalValues`), and `usesIndicesIntoUniqueValues` (use `isEnum`).
  * Removed the previously-deprecated `dataSetID` property from `AbsIttCatalogItem`.  Use `datasetId` instead.
  * Removed the previously-deprecated `allowGroups` property from `CkanCatalogItem`.   Use `allowWmsGroups` or `allowWfsGroups` instead.
  * Removed the previously-deprecated `RegionMapping.setRegionColumnType` function.  Use the `setRegionColumnType` on an _instance_ of `RegionMapping` instead.
  * Removed the previously-deprecated `regionMapping.regionDetails[].column` and `.disambigColumn`. Use `.columnName` and `.disambigColumnName` instead.
  * Removed the previously-deprecated `options.regionMappingDefinitionsUrl` parameter from the `Terria` constructor.  Set the `regionMappingDefinitionsUrl` inside `parameters` in `config.json` instead.
* Fixed a bug in `WebMapServiceCatalogItem` that prevented TerriaJS from correctly determining the projections supported by a WMS layer when supported projections are inherited from parent layers.
* Changed "no value" colour of region-mapped data to fully transparent, not black.
* Fixed an issue where expanding a chart from an SDMX-JSON or SOS feature twice, with different data choices selected, would overwrite the previous chart.
* Improved SDMX-JSON items to still show properly, even if the `selectedInitially` property is invalid.
* Added `Score` column to `GNAFAddressGeocoder` to indicate relative quality, which maps as default variable.

### 4.10.5

* Improved error message when accessing the user's location under http with Chrome.
* When searching locations, the button to instead search the catalog is now above the results instead of below them.
* Changed "go to full screen mode" tooltip to "Hide workbench", and "Exit Full Screen" button to "Show Workbench".  The term "full screen" was misleading.
* Fixed a bug where a chartable (non-geo-spatial) CSV file with a column including the text "height" would not let the user choose the "height" column as the y-axis of a chart.
* Added support for non-default x-axes for charts via `<chart x-column="x">` and the new `tableStyle.xAxis` parameter.
* Added support for a `charSet` parameter on CSV catalog items, which overrides the server's mime-type if present.

### 4.10.4

* Added the ability for `CkanCatalogGroup` to receive results in pages, rather than all in one request.  This will happen automatically when the server returns partial results.
* Improved the performance of the catalog UI by not creating React elements for the contents of a group until that group is opened.
* Close polygons used as input to a `CatalogFunction` by making the last position the same as the first one.
* Added support for a new `nameInCatalog` property on all catalog members which overrides `name` when displayed in the catalog, if present.
* Added `terria.urlEncodeComponent` function for use in feature info templates.
* `yAxisMin` and `yAxisMax` are now honored when multiple charts are active, by using the minimum `yAxisMin` and the maximum `yAxisMax` of all charts.

### 4.10.3

* Locked third-party dependency proj4 to v2.3.x because v2.4.0 breaks our build.

### 4.10.2

* New sections are now merged info `CatalogMember.info` when `updateFromJson` is called multiple times, rather than the later `info` completely replacing the earlier one.  This is most useful when using `itemProperties` to override some of the info sections in a child catalog item.
* Fixed a bug where csv files with a date column would sometimes fail if a date is missing.

### 4.10.1

* Improved the SDMX-JSON catalog item to handle huge dimensions, allow a blacklist, handle bad responses better, and more.
* Fixed a bug that prevented the proxy from being used for loading legends, even in situations where it is necessary such as an `http` legend accessed from an `https` site.
* Added link to re-download local files, noting that TerriaJS may have done additional processing (eg. geocoding).

### 4.10.0

* Changed defaults:
  * `WebProcessingServiceCatalogFunction` now defaults to invoking the `Execute` service via an HTTP POST with XML encoding rather than an HTTP GET with KVP encoding.  This is a more sensible default because the WPS specification requires that servers support POST/XML while GET/KVP is optional.  Plus, POST/XML allows large input parameters, such as a polygon descibing all of Australia, to be successfully passed to the WPS process.  To force use of GET/KVP, set the `executeWithHttpGet` property to `true`.
* Fixed problems with third-party dependencies causing `npm install` and `npm run gulp` to fail.

### 4.9.0

* Added a help overlay system. A TerriaJS application can define a set of help sequences that interactively walk the user through a task, such as adding data to the map or changing map settings. The help sequences usually appear as a drop-down Help menu in the top-right corner.
* Fixed a bug with calculating bounding rectangles in `ArcGisCatalogItem` caused by changes to `proj4` package.
* Fixed a bug preventing chart axis labels from being visible on a white background.
* Fixed a bug that caused the Feedback panel to appear below the chart panel, making it difficult to use.

### 4.8.2

* Fixed a bug that prevented a `shareUrl` specified in `config.json` from actually being used by the `ShareDataService`.
* Adding a JSON init file by dropping it on the map or selecting it from the My Data tab no longer adds an entry to the Workbench and My Data catalog.
* WPS return type can now be `application/vnd.terriajs.catalog-member+json` which allows a json catalog member to be returned in WPS along with the usual attributes to control display.
* `chartLineColor` tableStyle attribute added, allowing per column specification of chart line color.
* Fixed a bug that caused a `WebMapServiceCatalogItem` inside a `WebMapServiceCatalogGroup` to revert to defaults from GetCapabilities instead of using shared properties.
* Fix a bug that prevented drawing the marker and zooming to the point when searching for a location in 2D.
* Fixed a bug where `WebMapTileServiceCatalogItem` would incorrectly interpret a bounding box and return only the lower left corner causing Cesium to crash on render.
* Fixed a bug that caused the feedback form to be submitted when unchecking "Share my map view".

### 4.8.1

* `CkanCatalogGroup` now automatically adds the type of the resource (e.g. `(WMS)`) after the name when a dataset contains multiple resources that can be turned into catalog items and `useResourceName` is false.
* Added support for ArcGIS FeatureServers to `CkanCatalogGroup` and `CkanCatalogItem`.  In order for `CkanCatalogGroup` to include FeatureServers, `includeEsriFeatureServer` must be set to true.
* Changed default URL for the share service from `/share` to `share` and made it configurable by specifying `shareUrl` in config.json.  This helps with deployments in subdirectories.

### 4.8.0

* Fixed a bug that prevented downloading data from the chart panel if the map was started in 2D mode.
* Changed the default opacity of table data to 0.8 from 0.6.
* Added the ability to read dates in the format "2017-Q2".
* Improved support for SDMX-JSON, including showing values as a percent of regional totals, showing the selected conditions in a more concise format, and fixing some bugs.
* Updated `TableCatalogItem`s to show a download URL in About This Dataset, which downloads the entire dataset as csv, even if the original data was more complex (eg. from an API).
* The icon specified to the `MenuPanel` / `DropdownPanel` theme can now be either the identifier of an icon from `Icon.GLYPHS` or an actual SVG `require`'d via the `svg-sprite-loader`.
* Fixed a bug that caused time-varying points from a CSV file to leave a trail on the 2D map.
* Add `Terria.filterStartDataCallback`.  This callback gives an application the opportunity to modify start (share) data supplied in a URL before TerriaJS loads it.
* Reduced the size of the initial TerriaJS JavaScript code by about 30% when starting in 2D mode.
* Upgraded to [Cesium 1.29](https://github.com/AnalyticalGraphicsInc/cesium/blob/1.29/CHANGES.md).

### 4.7.4

* Renamed `SpatialDetailingFunction`, `WhyAmISpecialFunction`, and `PlacesLikeMeFunction` to `SpatialDetailingCatalogFunction`, `WhyAmISpecialCatalogFunction`, and `PlacesLikeMeCatalogFunction`, respectively.  The old names will be removed in a future release.
* Fixed incorrect tooltip text for the Share button.
* Improved the build process and content of the user guide documentation.

### 4.7.3

* Canceled pending tile requests when removing a layer from the 2D map.  This should drastically improve the responsiveness when dragging the time slider of a time-dynamic layer in 2D mode.
* Added the data source and data service details to the "About this dataset" (preview) panel.
* Fixed a bug introduced in 4.7.2 which made the Feature Info panel background too pale.

### 4.7.2

* Updated GNAF API to new Lucene-based backend, which should improve performance.
* Updated custom `<chart>` tag to allow a `colors` attribute, containing comma separated css strings (one per column), allowing users to customize chart colors. The `colors` attribute in charts can also be passed through from a WPS ComplexData response.
* Updated styling of Give Feedback form.
* Improved consistency of "Search" and "Add Data" font sizes.
* Improved flexibility of Feature Info Panel styling.
* Fixed a bug that could cause an extra `/` to be added to end of URLs by `ArcGisMapServerCatalogItem`, causing some servers to reject the request.
* Added a workaround for a bug in Internet Explorer 11 on Windows 7 that could cause the user interface to hang.

### 4.7.1

* Fixed a bug where providing feedback did not properly share the map view.
* Updated to terriajs-server 2.6.2.
* Fixed a bug leading to oversized graphics being displayed from WPS calls.

### 4.7.0

* Added the ability for users to share their view of the map when providing feedback.
* Extra components can now be added to FeatureInfoSection.
* Updated "Download Data" in FeatureInfoSection to "Download Data for this Feature".
* Fixed the color of visited links in client apps with their own css variables.
* Fixed a bug that prevented the scale bar from displaying correctly.

### 4.6.1

* Added support for creating custom WPS types, and for reusing `Point`, `Polygon`, and `Region` editors in custom types.
* Fixed a bug that caused the legend to be missing for WMS catalog items where the legend came from GetCapabilities but the URL did not contain `GetLegendGraphic`.

### 4.6.0

* Changed defaults:
  * The `clipToRectangle` property of raster catalog items (`WebMapServiceCatalogItem`, `ArcGisMapServerCatalogItem`, etc.) now defaults to `true`.  It was `false` in previous releases.  Using `false` prevents features (especially point features) right at the edge of the layer's rectangle from being cut off when the server reports too tight a rectangle, but also causes the layer to load much more slowly in many cases.  Starting in this version, we favour performance and the much more common case that the rectangle can be trusted.
* Made `WebMapServiceCatalogItem` tolerant of a `GetCapabilities` where a `LegendURL` element does not have an `OnlineResource` or a `Dimension` does not have any values.
* Added support for 'Long' type hint to CSV data for specifying longitude.
* The marker indicating the location of a search result is now placed correctly on the terrain surface.
* `CatalogFunction` region parameters are now selected on the main map rather than the preview map.
* Some regions that were previously not selectable in Analytics, except via autocomplete, are now selectable.
* Added hover text that shows the position of data catalog search results in the full catalog.
* Widened scrollbars and improve their contrast.
* Removed the default maximum number of 10 results when searching the data catalog.
* Allow users to browse for JSON configuration files when adding "Local Data".
* Made it easier to use custom fonts and colors in applications built on TerriaJS, via new SCSS variables.
* Fixed a bug that caused a `CswCatalogGroup` to fail to load if the server had a `references` element without a `protocol`.

### 4.5.1

* The order of the legend for an `ArcGisMapServerCatalogItem` now matches the order used by ArcGIS itself.
* Large legends are now scaled down to fit within the width of the workbench panel.
* Improved the styling of links inside the Feature Information panel.
* Fixed a bug that could cause the Feature Information panel's close button to initially appear in the wrong place, and then jump to the right place when moving the mouse near it.

### 4.5.0

* Added support for the Sensor Observation Service format, via the `SensorObservationServiceCatalogItem`.
* Added support for end date columns in CSV data (automatic with column names containing `end_date`, `end date`, `end_time`, `end time`; or set in json file using `isEndDate` in `tableStyle.columns`.
* Fixed calculation of end dates for moving-point CSV files, which could lead to points disappearing periodically.
* Fixed a bug that prevented fractional seconds in time-varying WMS periodicity.
* Added the ability to the workbench UI to select the `style` to use to display a Web Map Service (WMS) layer when multiple styles are available.
* Added the ability to the workbench UI to select from among the available dimensions of a Web Map Service (WMS) layer.
* Improved the error reporting and handling when specifying invalid values for the WMS COLORSCALERANGE parameter in the UI.
* Added the ability to drag existing points when creating a `UserDrawing`.
* Fixed a bug that could cause nonsensical legends for CSV columns with all null values.
* Fixed a bug that prevented the Share panel from being used at all if the URL shortening service encountered an error.
* Fixed a bug that could cause an error when adding multiple catalog items to the map quickly.
* Tweaked the z-order of the window that appears when hovering over a chart series, so that it does not appear on top of the Feature Information panel.
* Fixed a bug that could lead to incorrect colors in a legend for a CSV file with explicit `colorBins` and cut off at a minimum and maximum.
* We now show the feature info panel the first time a dataset is added, containing a suggestion to click the map to learn more about a location.  Also improved the wording for the feature info panel when there is no data.
* Fixed support for time-varying feature info for vector tile based region mapping.
* `updateApplicationOnMessageFromParentWindow` now also allows messages from the `opener` window, i.e. the window that opened the page by calling `window.open`.  The parent or opener may now also send a message with an `allowOrigin` property to specify an origin that should be allowed to post messages.
* Fixed a bug that prevented charts from loading http urls from https.
* The `isNcWMS` property of `WebMapServiceCatalogItem` is now set to true, and the COLORSCALERANGE controls are available in the UI, for ncWMS2 servers.
* Added the ability to prevent CSVs with time and `id` columns from appearing as moving points, by setting `idColumns` to either `null` or `[]`.
* Fixed a bug that prevented default parameters to `CatalogFunction`s from being shown in the user interface.
* Fixed a problem that made `BooleanParameter`s show up incorrectly in the user interface.
* Embedded `<chart>` elements now support two new optional attributes:
   * `title`: overrides the title that would otherwise be derived from the name of the feature.
   * `hide-buttons`: If `"true"`, the Expand and Download buttons are hidden from the chart.
* Fixed a bug in embedded `<collapsible>` elements that prevented them from being expandable.
* Improved SDMX-JSON support to make it possible to change region type in the UI.
* Deprecated `RegionMapping.setRegionColumnType` in favour of `RegionMapping.prototype.setRegionColumnType`. `regionDetails[].column` and `.disambigColumn` have also been deprecated.

### 4.4.1

* Improved feature info display of time-varying region-mapped csvs, so that chart is still shown at times with no data.
* Fix visual hierarchy of groups and items in the catalog.

### 4.4.0

* Fixed a bug that caused Cesium (3D view) to crash when plotting a CSV with non-numerical data in the depth column.
* Added automatic time-series charts of attributes to the feature info of time-varying region-mapped csvs.
* Refactored Csv, AbsItt and Sdmx-Json catalog items to depend on a common `TableCatalogItem`. Deprecated `CsvCatalogItem.setActiveTimeColumn` in favour of `tableStructure.setActiveTimeColumn`.
* Error in geocoding addresses in csv files now shows in dialog box.
* Fixed CSS styling of the timeline and added padding to the feature info panel.
* Enhanced JSON support to recognise JSON5 format for user-added files.
* Deprecated `indicesIntoUniqueValues`, `indicesOrValues`, `indicesOrNumericalValues` and `usesIndicesIntoUniqueValues` in `TableColumn` (`isEnum` replaces `usesIndicesIntoUniqueValues`).
* Added support for explicitly colouring enum columns using a `tableStyle.colorBins` array of `{"value":v, "color":c}` objects
* Improved rendering speed when changing the display variable for large lat/lon csv files.
* Default to moving feature CSVs if a time, latitude, longitude and a column named `id` are present.
* Fixed a bug so units flow through to charts of moving CSV features.
* Fixed a bug that prevented the `contextItem` of a `CatalogFunction` from showing during location selection.
* Fixed a bug that caused `&amp;` to appear in some URLs instead of simply `&`, leading to an error when visiting the link.
* Added the ability to pass a LineString to a Web Processing Service.
* Fixed a bug that prevented `tableStyle.dataVariable` = `null` from working.
* Uses a smarter default column for CSV files.
* Fixed a bug that caused an error message to appear repeatedly when there was an error downloading tiles for a base map.
* Fixed a bug that caused WMS layer names and WFS type names to not be displayed on the dataset info page.
* We now preserve the state of the feature information panel when sharing.  This was lost in the transition to the new user interface in 4.0.0.
* Added a popup message when using region mapping on old browsers without an `ArrayBuffer` type (such as Internet Explorer 9).  These browsers won't support vector tile based region mapping.
* Fixed bug where generic parameters such as strings were not passed through to WPS services.
* Fixed a bug where the chart panel did not update with polled data files.
* Removed the Australian Hydrography layer from `createAustraliaBaseMapOptions`, as the source is no longer available.
* Fixed a bug that caused the GetCapabilities URL of a WMS catalog item to be shown even when `hideSource` was set to true.
* Newly-added user data is now automatically selected for the preview map.
* Fixed a bug where selecting a new column on a moving point CSV file did not update the chart in the feature info panel.
* Fixed dropdowns dropping from the bounds of the screen in Safari.
* Fixed a bug that prevented the feature info panel from updating with polled lat/lon csvs.
* Improved handing of missing data in charts, so that it is ignored instead of shown as 0.

### 4.3.3

* Use react-rangeslider 1.0.4 because 1.0.5 was published incorrectly.

### 4.3.2

* Fixed css styling of shorten URL checkbox.

### 4.3.1

* Added the ability to specify the URL to the `serverConfig` service in `config.json` as `parameters.serverConfigUrl`.

### 4.3.0

* Added `Terria.batchGeocoder` property.  If set, the batch geocoder is used to resolve addresses in CSV files so that they can be shown as points on the map.
* Added `GnafAddressGeocoder` to resolve Australian addresses using the GNAF API.
* Added a loading indicator for user-added files.
* Fixed a bug that prevented printing the map in the 2D mode.
* Fixed a bug when changing between x-axis units in the chart panel.
* Moved all Terria styles into CSS-modules code (except Leaflet) - `lib/Sass/StandardUserInterface.scss` no longer needs to be imported and now only includes styles for backwards compatibility.

### 4.2.1

* Fixed bug that prevented the preview map displaying on mobile devices.

### 4.2.0

* There is a known bug in this version which prevents the user from being able to choose a region for some Analytics functions.
* Added support for ArcGis FeatureServers, using the new catalog types `esri-featureServer` and `esri-featureServer-group`. Catalog type `esri-group` can load REST service, MapServer and FeatureServer endpoints. (For backwards compatibility, catalog type `esri-mapServer-group` continues to work for REST service as well as MapServer endpoints.)
* Enumeration parameter now defaults to what is shown in UI, and if parameter is optional, '' is default.
* Adds bulk geocoding capability for Australian addresses. So GnafAPI can be used with batches of addresses, if configured.
* Fixed a bug that caused the selection indicator to get small when near the right edge of the map and to overlap the side panel when past the left edge.
* Map controls and menus now become translucent while the explorer window (Data Catalog) is visible.
* Removed find-and-replace for cesium workers from the webpack build as it's done in terriajs-cesium now.
* Legend images that fail to load are now hidden entirely.
* Improved the appearance of the opacity slider and added a percentage display.
* AllowedValues for LiteralData WPS input now works even if only one value specified.
* Fixed bug in WPS polygon datatype to return valid polygon geojson.
* Fix regression: cursor changes in UserDrawing now functions in 2D as well as 3D.
* Updated to [Cesium](http://cesiumjs.org) 1.23 (from 1.20).  See the [change log](https://github.com/AnalyticalGraphicsInc/cesium/blob/1.23/CHANGES.md) for details.
* Fixed a bug which prevented feature info showing for Gpx-, Ogr-, WebFeatureService-, ArcGisFeatureServer-, and WebProcessingService- CatalogItems.
* Added support for a wider range of SDMX-JSON data files, including the ability to sum over dimensions via `aggregatedDimensionIds`.
* Added support for `tableStyle.colorBins` as array of values specifying the boundaries between the color bins in the legend, eg. `[3000, 3500, 3900, 4000]`. `colorBins` can still be an integer specifying the number of bins, in which case Terria determines the boundaries.
* Made explorer panel not rendered at all when hidden and made the preview map destroy itself when unmounted - this mitigates performance issues from having Leaflet running in the background on very busy vector datasets.
* Fixed a bug which prevented time-varying CZML feature info from updating.
* Added support for moving-point csv files, via an `idColumns` array on csv catalog items. By default, feature positions, color and size are interpolated between the known time values; set `isSampled` to false to prevent this. (Color and size are never interpolated when they are drawn from a text column.)
* Added support for polling csv files with a partial update, and by using `idColumns` to identify features across updates.
* Added a time series chart to the Feature Info Panel for sampled, moving features.
* Fixed a bug which sometimes prevented feature info from appearing when two region-mapped csv files were displayed.
* Fixed the preview map extent being one item behind what was actually selected.

### 4.1.2

* Fixed a bug that prevented sharing from working in Internet Explorer.

### 4.1.1

* Stopped IE9 from setting bizarre inline dimensions on custom branding images.
* Fixed workbench reordering in browsers other than Chrome.
* URLs on the dataset info page are now auto-selected by clicked, making them easier to copy.

### 4.1.0

* Made the column title for time-based CSV exports from chart default to 'date'
* Stopped the CSV creation webworker from being run multiple times on viewing a chart.
* Removed the empty circles from non-selected base maps on the Map settings panel.
* Prevented text from being selected when dragging the compass control.
* Added the `MeasureTool` to allow users to interactively measure the distance between points.
* Worked around a problem in the Websense Web Filter that caused it to block access to some of the TerriaJS Web Workers due to a URL in the license text in a comment in a source file.

### 4.0.2

* Fixed a bug that prevented opening catalog groups on iOS.
* Fixed a CSS warning.

### 4.0.1

* Fixed a bug that caused an error message to be formatted incorrectly when displayed to the user.

### 4.0.0

* Rewrote the TerriaJS user interface using React.  We believe the new interface is a drastic improvement, incorporating user feedback and the results of usability testing.  Currently, it is a bit harder to customize than our old user interface, so if your application has extensive customizations, we suggest delaying upgrading to this version for a little while logner.
* Added support for non-geospatial CSV files, which display in a new chart panel.
* Added support for customisable tags in Feature Info templates.
* Implemented [`<chart>` and `<collapsible>`](https://github.com/TerriaJS/terriajs/blob/4.0.0/lib/ReactViews/Custom/registerCustomComponentTypes.js#L52-L106) tags in Feature Info templates.
* Added support for [polling](https://github.com/TerriaJS/terriajs/blob/4.0.0/lib/Models/Polling.js) for updates to CSV files.
* `CswCatalogGroup` will now include Web Processing Services from the catalog if configured with `includeWps` set to true.
* `WebMapServiceCatalogItem` will now detect ncWMS servers and set isNcWMS to true.
* New `ShareDataService` which can store and resolve data. Currently it is used as a replacement for Google URL Shortener, which can't handle long URLs.
* New `ServerConfig` object which provides configuration information about the server, including which domains can be proxied for. This changes the way CorsProxy is initialised.
* Added partial support for the SDMX-JSON format.
* `UserDrawing` added for drawing lines and polygons on the map.
* CkanCatalogGroup's `filterQuery` items can now be specified as objects instead of URL-encoded strings.

### 3.5.0

* Ungrouped items in CKAN catalog items are now grouped under an item whose title is determined by .ungroupedTitle (default: "No group").
* CKAN's default search regex for KMLs also includes KMZ.
* Add documentation of camera properties.

### 3.4.0

* Support JSON5 (http://json5.org/) use in init files and config files, so comments can be used and object keys don't need to be quoted.
* Fixed a bug that caused the `corsProxyBaseUrl` specified in `config.json` to be ignored.
* Fixed a bug preventing downloading feature info data in CSV format if it contained nulls.
* Added support for the WMS Style/MetadataURL tag in layer description.
* Long titles in locally-generated titles now word-wrap in most web browsers.
* Long auto-generated legend titles now word wrap in most web browsers.

### 3.3.0

* Support `parameters` property in WebFeatureServiceCatalogItem to allow accessing URLs that need additional parameters.
* Fixed a bug where visiting a shared link with a time-series layer would crash load.
* Added a direct way to format numbers in feature info templates, eg. `{{#terria.formatNumber}}{"useGrouping": true, "maximumFractionDigits": 3}{{value}}{{/terria.formatNumber}}`. The quotes around the keys are optional.
* When the number of unique values in a CSV column exceeds the number of color bins available, the legend now displays "XX other values" as the label for the last bucket rather than simply "Other".
* CSV columns with up to 21 unique values can now be fully displayed in the legend.  Previously, the number of bins was limited to 9.
* Added `cycle` option to `tableColumnStyle.colorBinMethod` for enumeration-type CSV columns.  When the number of unique values in the column exceeds the number of color bins available, this option makes TerriaJS color all values by cycling through the available colors, rather than coloring only the most common values and lumping the rest into an "Other" bucket.
* Metadata and single data files (e.g. KML, GeoJSON) are now consistently cached for one day instead of two weeks.
* `WebMapServiceCatalogItem` now uses the legend for the `style` specified in `parameters` when possible.  It also now includes the `parameters` when building a `GetLegendGraphic` URL.
* Fixed a bug that prevented switching to the 3D view after starting the application in 2D mode.

### 3.2.1

* Fixed a bug on IE9 which prevented shortened URLs from loading.
* Fixed a map started with smooth terrain being unable to switch to 3D terrain.
* Fixed a bug in `CkanCatalogItem` that prevented it from using the proxy for dataset URLs.
* Fixed feature picking when displaying a point-based vector and a region mapped layer at the same time.
* Stopped generation of WMS intervals being dependent on JS dates and hence sensitive to DST time gaps.
* Fixed a bug which led to zero property values being considered time-varying in the Feature Info panel.
* Fixed a bug which prevented lat/lon injection into templates with time-varying properties.

### 3.2.0

* Deprecated in this version:
  - `CkanCatalogItem.createCatalogItemFromResource`'s `options` `allowGroups` has been replaced with `allowWmsGroups` and `allowWfsGroups`.
* Added support for WFS in CKAN items.
* Fixed bug which prevented the terria-server's `"proxyAllDomains": true` option from working.
* Added support in FeatureInfoTemplate for referencing csv columns by either their name in the csv file, or the name they are given via `TableStyle.columns...name` (if any).
* Improved CSV handling to ignore any blank lines, ie. those containing only commas.
* Fixed a bug in `CswCatalogGroup` that prevented it from working in Internet Explorer.

### 3.1.0

* Only trigger a search when the user presses enter or stops typing for 3 seconds.  This will greatly reduce the number of times that searches are performed, which is important with a geocoder like Bing Maps that counts each geocode as a transaction.
* Reduced the tendency for search to lock up the web browser while it is in progress.
* Include "engines" attribute in package.json to indicate required Node and NPM version.
* For WMS catalog items that have animated data, the initial time of the timeslider can be specified with `initialTimeSource` as `start`, `end`, `present` (nearest date to present), or with an ISO8601 date.
* Added ability to remove csv columns from the Now Viewing panel, using `"type": "HIDDEN"` in `tableStyle.columns`.

### 3.0.0

* TerriaJS-based application are now best built using Webpack instead of Browserify.
* Injected clicked lat and long into templates under `{{terria.coords.latitude}}` and `{{terria.coords.longitude}}`.
* Fixed an exception being thrown when selecting a region while another region highlight was still loading.
* Added `CesiumTerrainCatalogItem` to display a 3D surface model in a supported Cesium format.
* Added support for configuration of how time is displayed on the timeline - catalog items can now specify a dateFormat hash
    in their configuration that has formats for `timelineTic` (what is displayed on the timeline itself) and `currentTime`
    (which is the current time at the top-left).
* Fixed display when `tableStyle.colorBins` is 0.
* Added `fogSettings` option to init file to customize fog settings, introduced in Cesium 1.16.
* Improved zooming to csvs, to include a small margin around the points.
* Support ArcGis MapServer extents specified in a wider range of projections, including GDA MGA zones.
* WMS legends now use a bigger font, include labels, and are anti-aliased when we can determine that the server is Geoserver and supports these options.
* Updated to [Cesium](http://cesiumjs.org) 1.20.  Significant changes relevant to TerriaJS users include:
    * Fixed loading for KML `NetworkLink` to not append a `?` if there isn't a query string.
    * Fixed handling of non-standard KML `styleUrl` references within a `StyleMap`.
    * Fixed issue in KML where StyleMaps from external documents fail to load.
    * Added translucent and colored image support to KML ground overlays
    * `GeoJsonDataSource` now handles CRS `urn:ogc:def:crs:EPSG::4326`
    * Fix a race condition that would cause the terrain to continue loading and unloading or cause a crash when changing terrain providers. [#3690](https://github.com/AnalyticalGraphicsInc/cesium/issues/3690)
    * Fix issue where the `GroundPrimitive` volume was being clipped by the far plane. [#3706](https://github.com/AnalyticalGraphicsInc/cesium/issues/3706)
    * Fixed a reentrancy bug in `EntityCollection.collectionChanged`. [#3739](https://github.com/AnalyticalGraphicsInc/cesium/pull/3739)
    * Fixed a crash that would occur if you added and removed an `Entity` with a path without ever actually rendering it. [#3738](https://github.com/AnalyticalGraphicsInc/cesium/pull/3738)
    * Fixed issue causing parts of geometry and billboards/labels to be clipped. [#3748](https://github.com/AnalyticalGraphicsInc/cesium/issues/3748)
    * Fixed bug where transparent image materials were drawn black.
    * Fixed `Color.fromCssColorString` from reusing the input `result` alpha value in some cases.
* Added support for time-series data sets with gaps - these are skipped when scrubbing on the timeline or playing.

### 2.3.0

* Share links now contain details about the picked point, picked features and currently selected feature.
* Reorganised the display of disclaimers so that they're triggered by `CatalogGroup` and `CatalogItem` models, which trigger `terria.disclaimerEvent`, which is listened to by DisclaimerViewModel`. `DisclaimerViewModel` must be added by the map that's using Terria.
* Added a mechanism for hiding the source of a CatalogItem in the view info popup.
* Added the `hideSource` flag to the init json for hiding the source of a CatalogItem in the View Info popup.
* Fixed a bug where `CatalogMember.load` would return a new promise every time it was called, instead of retaining the one in progress.
* Added support for the `copyrightText` property for ArcGis layers - this now shows up in info under "Copyright Text"
* Showed a message in the catalog item info panel that informs the user that a catalog item is local and can't be shared.
* TerriaJS now obtains its list of domains that the proxy will proxy for from the `proxyableDomains/` service.  The URL can be overridden by setting `parameters.proxyableDomainsUrl` in `config.json`.
* Updated to [Cesium](http://cesiumjs.org) 1.19.  Significant changes relevant to TerriaJS users include:
    * Improved KML support.
        * Added support for `NetworkLink` refresh modes `onInterval`, `onExpire` and `onStop`. Includes support for `viewboundScale`, `viewFormat`, `httpQuery`.
        * Added partial support for `NetworkLinkControl` including `minRefreshPeriod`, `cookie` and `expires`.
        * Added support for local `StyleMap`. The `highlight` style is still ignored.
        * Added support for `root://` URLs.
        * Added more warnings for unsupported features.
        * Improved style processing in IE.

### 2.2.1

* Improved legend and coloring of ENUM (string) columns of CSV files, to sort first by frequency, then alphabetically.

### 2.2.0

* Warn user when the requested WMS layer doesn't exist, and try to provide a suggestion.
* Fixed the calculation of a CSV file's extent so that missing latitudes and longitudes are ignored, not treated as zero.
* Improved the user experience around uploading files in a format not directly supported by TerriaJS and optionally using the conversion service.
* Improved performance of large CSV files, especially the loading time, and the time taken to change the display variable of region-mapped files.
* Added support for CSV files with only location (lat/lon or region) columns, and no value columns, using a file-specific color. Revised GeoJSON display to draw from the same palette of colors.
* Fixed a bug that prevented GeoJSON styles from being applied correctly in some cases.
* Fixed an error when adding a CSV with one line of data.
* Fixed error when adding a CSV file with numeric column names.
* Polygons and polylines are now highlighted on click when the geometry is available.
* Improved legend and coloring of ENUM (string) columns of CSV files; only the most common values are colored differently, with the rest shown as 'Other'.
* Added support for running the automated tests on the local system (via `gulp test`), on BrowserStack (via `gulp test-browserstack`), and on Sauce Labs (via `gulp test-saucelabs`).
* Changed `tableStyle`'s `format` to only accept `useGrouping`, `maximumFractionDigits` and `styling: "percent"` options. Previously some other options may have worked in some browsers.
* Improved color palette for string (ENUM) columns of CSV files.
* Improved CSV loading to ignore any completely blank lines after the header row (ie. lines which do not even have commas).
* Added support for grouping catalog items retrieved from a CSW server according to criteria specified in the init file (via the `metadataGroups` property) or from a `domainSpecification` and a call to the `GetDomain` service on the CSW server.
* Added `UrlTemplateCatalogItem`, which can be used to access maps via a URL template.
* Improved ABS display (to hide the regions) when a concept is deselected.
* Improved readability of ArcGIS catalog items and legends by replacing underscores with spaces.
* `ArcGisMapServerCatalogItem` metadata is now cached by the proxy for only 24 hours.
* Improved the feature info panel to update the display of time-varying region-mapped CSV files for the current time.
* Updated to [Cesium](http://cesiumjs.org) 1.18.  Significant changes relevant to TerriaJS users include:
  * Improved terrain performance by up to 35%. Added support for fog near the horizon, which improves performance by rendering less terrain tiles and reduces terrain tile requests. [#3154](https://github.com/AnalyticalGraphicsInc/cesium/pull/3154)
  * Reduced the amount of GPU and CPU memory used by terrain by using compression. The CPU memory was reduced by up to 40%, and approximately another 25% in Chrome.
  * Fixed an issue where the sun texture is not generated correctly on some mobile devices. [#3141](https://github.com/AnalyticalGraphicsInc/cesium/issues/3141)
  * Cesium now honors window.devicePixelRatio on browsers that support the CSS imageRendering attribute. This greatly improves performance on mobile devices and high DPI displays by rendering at the browser-recommended resolution. This also reduces bandwidth usage and increases battery life in these cases.

### 2.1.1

* Fixed sharing of time-varying czml files; the timeline was not showing on the shared link.
* Fixed sharing of user-added time-varying csv files.
* Fixed a bug in `CkanCatalogItem` that made it build URLs incorrectly when given a base URL ending in a slash.

### 2.1.0

* Moved `TableColumn`, `TableStructure`, and the classes based on `Concept` to `lib/Map`. Moved `LegendHelper` to `lib/Models`.
* Added column-specific styling to CSV files, using a new `tableStyle.columns` json parameter. This is an object whose keys are column names or indices, and whose values are objects of column-specific tableStyle parameters. See the CSV column-specific group in `wwwroot/test/init/test-tablestyle.json` for an example. [#1097](https://github.com/TerriaJS/terriajs/issues/1097)
* Added the following column-specific `tableStyle` parameters:
  - `name`: renames the column.
  - `type`: sets the column type; can be one of LON, LAT, ALT, TIME, SCALAR, or ENUM.
  - `format`: sets the column number format, using the format of the [Javascript Intl options parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString), eg. `{"format": {"useGrouping": true, "maximumFractionDigits": 2}}` to add thousands separators to numbers and show only two decimal places. Only the `useGrouping`, `maximumFractionDigits` and `styling: "percent"` options are guaranteed to work in all browsers.
* Added column-specific formatting to the feature info panel for all file types, eg. `"featureInfoTemplate" : {"template": "{{SPEED}} m/s", "formats": {"SPEED": {"maximumFractionDigits": 2}}}`. The formatting options are the same as above.
* Changed the default number format in the Feature Info Panel to not separate thousands with commas.
* Fixed a bug that caused the content on the feature info panel to be rendered as pure HTML instead of as mixed HTML / Markdown.
* Changed the default for `tableStyle.replaceWithZeroValues` to `[]`, ie. nothing.
* Changed the default for `tableStyle.replaceWithNullValues` to `["-", "na", "NA"]`.
* Changed the default for `tableStyle.nullLabel` to '(No value)'.
* Application name and support email can now be set in config.json's "parameters" section as "appName" and "supportEmail".
* Fixed showWarnings in config json not being respected by CSV catalog items.
* Fixed hidden region mapped layers being displayed when variable selection changes.
* Fixed exporting raw data as CSV not escaping commas in the data itself.

### 2.0.1

* Fixed a bug that caused the last selected ABS concept not to appear in the feature info panel.

### 2.0.0

* The following previously-deprecated functionality was removed in this version:
  - `ArcGisMapServerCatalogGroup`
  - `CatalogItemControl`
  - `CatalogItemDownloadControl`
  - Calling `BrandBarViewModel.create` with more than one parameter.
  - `CatalogMemberControl.leftSideItemControls`
  - `CatalogMemberControl.rightSideItemControls`
  - `DataCatalogTabViewModel.getRightSideItemControls`
  - `DataCatalogTabViewModel.getLeftSideItemControls`
  - `registerCatalogItemControls`
  - `AusGlobeViewer`
* Streamlined CSV handling framework. Breaking changes include the APIs of (not including those which begin with `_`):
  - `CsvCatalogItem`: `rowProperties`, `rowPropertiesByCode`, `dynamicUpdate` have been removed.
  - `AbsIttCatalogItem`: Completely rewritten. The `dataSetID` json parameter has been deprecated in favor of `datasetId` (different capitalization).
  - For the 2011 Australian Census data, requires `sa4_code_2011` to appear as an alias in `regionMapping.json` (it was previously missing in NationalMap).
  - `TableDataSource`: Completely rewritten and moved from `Map` to `Models` directory. Handles csvs with latitude & longitude columns.
  - `RegionMapping`: Used instead of TableDataSource for region-mapped csvs.
  - `DataTable` and `DataVariable` have been replaced with new classes, `TableStructure` and `TableColumn`.
  - `RegionProvider`: `loadRegionsFromWfs`, `processRegionIds`, `applyReplacements`, `findRegionIndex` have been made internal functions.
  - `RegionProviderList`: `chooseRegionProvider` has been changed and renamed `getRegionDetails `.
  - `ColorMap`: `fromArray` and `fromString` have been removed, with the constructor taking on that functionality.
  - `LegendUrl` has been moved to the `Map` directory.
  - `TableStyle`: `loadColorMap` and `chooseColorMap` have been removed. Moved from `Map` to `Models` directory.
  - `FeatureInfoPanelSectionViewModel`: its constructor now takes a `FeatureInfoPanelViewModel` as its first argument, instead of `Terria`.
  - `Models/ModelError` has been replaced with `Core/TerriaError`.
* Removed blank feature info sections for uncoloured regions of region-mapped CSVs.
* Recognises the CSV datetime formats: YYYY, YYYY-MM and YYYY-MM-DD HH:MM(:SS).
* Introduced five new json tableStyle parameters:
  - `replaceWithZeroValues`: Defaults to `[null, "-"]`. These values are coloured as if they were zero if they appear in a list with numbers. `null` catches missing values.
  - `replaceWithNullValues`: Defaults to `["na", "NA"]`. These values are coloured as if they were null if they appear in a list with numbers.
  - `nullColor`: A css string. Defaults to black. This colour is used to display null values. It is also used to colour points when no variable is selected.
  - `nullLabel`: A string used to label null or blank values in the legend. Defaults to ''.
  - `timeColumn`: Provide the name or index (starting at 0) of a csv column, if any. Defaults to the first time column found, if any. Use `null` to explicitly disregard all time columns.
* Removed variables consisting only of html tags from the Now Viewing panel.
* Added support for the csv datetime formats: YYYY, YYYY-MM and YYYY-MM-DD HH:MM(:SS).
* Improved formatting of datetimes from csv files in the feature info panel.
* Removed variables consisting only of html tags from the Now Viewing panel.
* Improved 
