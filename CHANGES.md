
Change Log
==========

### 4.0.0

* `CswCatalogGroup` will now include Web Processing Services from the catalog if configured with `includeWps` set to true.
* `WebMapServiceCatalogItem` will now detect ncWMS servers and set isNcWMS to true.
* New `ShareDataService` which can store and resolve data. Currently it is used as a replacement for Google URL Shortener, which can't handle long URLs.
* New `ServerConfig` object which provides configuration information about the server, including which domains can be proxied for. This changes the way CorsProxy is initialised.
* Added partial support for the SDMX-JSON format.

### 3.4.0

* Support JSON5 (http://json5.org/) use in init files and config files, so comments can be used and object keys don't need to be quoted. 
* Fixed a bug that caused the `corsProxyBaseUrl` specified in `config.json` to be ignored.
* Fixed a bug preventing downloading feature info data in CSV format if it contained nulls.
* Added support for the WMS Style/MetadataURL tag in layer description.
* Long titles in locally-generated titles now word-wrap in most web browsers.
* Long auto-generated legend titles now word wrap in most web browsers.
* Ungrouped items in CKAN catalog items are now grouped under an item whose title is determined by .ungroupedTitle (default: "No group").
* CKAN's default search regex for KMLs also includes KMZ.

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
* Improved handling of rows with missing dates in csv time columns.
* Introduced four new json tableStyle parameters:
  - `replaceWithZeroValues`: Defaults to `[null, '-']`. These values are coloured as if they were zero if they appear in a csv column with numbers. `null` catches missing values. These rows are ignored if they appear in a csv time column. 
  - `replaceWithNullValues`: Defaults to `['na', 'NA']`. These values are coloured as if they were null if they appear in a csv column with numbers. These rows are ignored if they appear in a csv time column.
  - `nullColor`: A css string. Defaults to a dark blue. This colour is used to display null values (but it does not appear on the legend). It is also used to colour points when no variable is selected.
  - `timeColumn`: Provide the name or index (starting at 0) of a csv column, if any. Defaults to the first time column found, if any. Use `null` to explicitly disregard all time columns.
* Added id matching for catalog members:
* Improved formatting of datetimes from csv files in the feature info panel.
* Removed variables consisting only of HTML tags from the Now Viewing panel.
* Added ID matching for catalog members:
  - An `id` field can now be set in JSON for catalog members
  - When sharing an enabled catalog item via a share link, the share link will reference the catalog item's ID
    rather than its name as is done currently.
  - The ID of an item should be accessed via `uniqueId` - if a catalog member doesn't have an ID set, this returns a
    default value of the item's name plus the ID of its parent. This means that if all the ancestors of a catalog
    member have no ID set, its ID will be its full path in the catalog.
  - This means that if an item is renamed or moved, share links that reference it will still work.
  - A `shareKeys` property can be also be set that contains an array of all ids that should lead to this item. This means
    that a share link for an item that didn't previously have an ID set can still be used if it's moved, as long as it
    has its old default ID set in `shareKeys`
  - Old share links will still work as long as the items they lead to aren't renamed or moved.
  - Refactor of JSON serialization - now rather than passing a number of flags that determine what should and shouldn't be
    serialized, an `itemFilter` and `propertyFilter` are passed in options. These are usually composed of multiple filters,
    combined using `combineFilters`.
  - An index of all items currently in the catalog against all of that item's shareKeys is now maintained in `Catalog`
    and can be used for O(1) lookups of any item regardless of its location.
  - CatalogMembers now contain a reference to their parent CatalogGroup - this means that the catalog tree can now be
    traversed in both directions.
  - When serializing user-added items in the catalog, the children of `CatalogGroup`s with the `url` property set are
    not serialized. Settings like `opacity` for their descendants that need to be preserved are serialized separately.
* Generated legends now use SVG (vector) format, which look better on high resolution devices.
* Created new Legend class, making it easy to generate client-side legends for different kinds of data.
* Generate client-side legends for ArcGIS MapServer catalog items, by fetching JSON file, instead of just providing link to external page.
* Fix Leaflet feature selection when zoomed out enough that the world is repeated.
* Improved handling of lat/lon CSV files with missing latitude or longitude values.
* Fixed a bug that prevented `SocrataCataloGroup` from working in Internet Explorer 9.
* Added `CkanCatalogItem`, which can be used to reference a particular resource of any compatible type on a CKAN server.
* Fixed a bug that caused the Now Viewing tab to display incorrectly in Internet Explorer 11 when switching directly to it from the Data Catalogue tab.

### 1.0.54

* Fixed a bug in `AbsIttCatalogItem` that caused no legend to be displayed.

### 1.0.53

* Improved compatibility with Internet Explorer 9.
* Made `CswCatalogGroup` able to find geospatial datasets on more CSW servers.
* Allow WMS parameters to be specified in json in uppercase (eg. STYLES).

### 1.0.52

* Added `MapBoxMapCatalogItem`, which is especially useful for base maps. A valid access token must be provided.
* Added a `getContainer()` method to Terria's `currentViewer`.
* Dramatically improved the performance of region mapping.
* Introduced new quantisation (color binning) methods to dramatically improve the display of choropleths (numerical quantities displayed as colors) for CSV files, instead of always using linear. Four values for `colorBinMethod` are supported:
  * "auto" (default), usually means "ckmeans"
  * "ckmeans": use "CK means" method, an improved version of Jenks Even Breaks to form clusters of values that are as distinct as possible.
  * "quantile": use quantiles, evenly distributing values between bins
  * "none": use the previous linear color mapping method.
* The default style for CSV files is now 7 color bins with CK means method.
* Added support for color palettes from Color Brewer (colorbrewer2.org). Within `tableStyle`, use a value like `"colorPalette": "10-class BrBG"`.
* Improved the display of legends for CSV files, accordingly.
* URLs for legends are now encapsulated in a `LegendUrl` model, which accepts a mime type that will affect how the
  legend is rendered in the sidebar.
* Added support for the Socrata "new backend" with GeoJSON download to `SocrataCatalogGroup`.
* Moved URL config parameters to config.json, with sensible defaults. Specifically:
  *   regionMappingDefinitionsUrl: 'data/regionMapping.json',
  *   conversionServiceBaseUrl: '/convert/',
  *   proj4ServiceBaseUrl: '/proj4/',
  *   corsProxyBaseUrl: '/proxy/'
* Deprecated terria.regionMappingDefinitionsUrl (set it in config.json or leave it as default).

### 1.0.51

* Fixed a typo that prevented clearing the search query
* Added support for Nominatim search API hosted by OpenStreetMap (http://wiki.openstreetmap.org/wiki/Nominatim) with `NominatimSearchProviderViewModel`. This works by merging to 2 queries : one with the bounding parameter for the nearest results, and the other without the bounding parameter. The `countryCodes` property can be set to limit the result to a set of specific countries.
* Added `MapProgressBarViewModel`.  When added to the user interface with `MapProgressBarViewModel.create`, it shows a bar at the top of the map window indicating tile load progress.
* We no longer show the entity's ID (which is usually a meaningless GUID) on the feature info panel when the feature does not have a name.  Instead, we leave the area blank.
* Fixed a bug with time-dynamic imagery layers that caused features to be picked from the next time to be displayed, in addition to the current one.
* Replace `.` and `#` with `_` in property names meant to be used with `featureInfoTemplate`, so that these properties can be accessed by the [mustache](https://mustache.github.io/) templating engine.
* Added support for time-varying properties (e.g. from a CZML file) on the feature info panel.
* `Cesium.zoomTo` now takes the terrain height into account when zooming to a rectangle.

### 1.0.50

* Put a white background behind legend images to fix legend images with transparent background being nearly invisible.
* Search entries are no longer duplicated for catalog items that appear in multiple places in the Data Catalogue
* Fixed the layer order changing in Cesium when a CSV variable is chosen.
* Layer name is now shown in the catalog item info panel for ESRI ArcGIS MapServer layers.
* Retrieve WFS or WCS URL associated with WMS data sources using DescribeLayer if no dataUrl is present.
* Downgrade Leaflet to 0.7.3 to fix specific feature clicking problems with 2D maps.
* Use `PolylineGraphics` instead of `PolygonGraphics` for unfilled polygons with an outline width greater than 1.  This works around the fact that Cesium does not support polygons with outline width great than 1 on Windows due to a WebGL limitation.
* Sorted ABS age variables numerically, not alphabetically.
* Removed extra space at the bottom of base map buttons.
* Share links now remember the currently active tab in the `ExplorerPanelViewModel`.
* Fixed a bug that prevented region mapping from working over HTTPS.
* The proxy is now used to avoid a mixed content warning when accessing an HTTP dataset from an HTTPS deployment of TerriaJS.
* Added `CameraView.fromLookAt` and `CameraView.fromPositionHeadingPitchRoll` functions.  These functions can be used to position the camera in new ways.

### 1.0.49

* Fixed a bug that caused poor performance when clicking a point on the map with lots of features and then closing the feature information panel.
* Apply linkify, instead of markdown, to properties shown in the Feature Info Panel.
* Fixed a bug that prevented feature scaling by value.
* Fixed a bug that prevented the csv `displayDuration` from working.
* Fixed a bug that ignored which column of the csv file to show as the legend initially.
* `NowViewingTabViewModel` is now composed of a number of sections.  Each section is given the opportunity to determine whether it applies to each catalog item.  Custom sections may be added by adding them to NowViewingTabViewModel.sections`.
* `CsvCatalogItem` and `AbsIttCatalogItem` now expose a `concepts` property that can be used to adjust the display.
* Added `Terria.cesiumBaseUrl` property.
* The user interface container DOM element may now be provided to `TerriaViewer` by specifying `uiContainer` in its options.  Previously it always used an element named `ui`.
* Legend URLs are now accessed via the proxy, if applicable.
* Fixed a bug that prevented feature scaling by value.
* Added support for [Urthecast](https://www.urthecast.com/) with `UrthecastCatalogGroup`.
* Fixed a bug that caused a `TypeError` on load when the share URL included enabled datasets with an order different from their order in the catalog.
* Improved the message that is shown to the user when their browser supports WebGL but it has a "major performance caveat".
* Fixed a bug that could cause an exception in some browsers (Internet Explorer, Safari) when loading a GeoJSON with embedded styles.
* Fixed a bug with Leaflet 2D map where clicks on animation controls or timeline would also register on the map underneath causing undesired feature selection and, when double clicked, zooming (also removed an old hack that disabled dragging while using the timeline slider)
* Changed Australian Topography base map server and updated the associated thumbnail.
* Added `updateApplicationOnMessageFromParentWindow` function.  After an app calls this function at startup, TerriaJS can be controlled by its parent window when embedded in an `iframe` by messages sent with `window.postMessage`.

### 1.0.48

* Added the ability to disable feature picking for `ArcGisMapServerCatalogItem`.
* Disabled feature picking for the Australian Topography and Australian Hydrography base layers created by `createAustraliaBaseMapOptions`.

### 1.0.47

* Make it possible to disable CSV region mapping warnings with the `showWarnings` init parameter.
* The `name` of a feature from a CSV file is now taken from a `name` or `title` column, if it exists.  Previously the name was always "Site Data".
* Fixed a bug that caused time-dynamic WMS layers with just one time to not be displayed.
* Underscores are now replaced with spaces in the feature info panel for `GeoJsonCatalogItem`.
* Added Proj4 projections to the location bar. Clicking on the bar switches between lats/longs and projected coordinates. To enable this, set `useProjection` to `true`
* Show information for all WMS features when a location is clicked.
* Fixed a bug that caused an exception when running inside an `<iframe>` and the user's browser blocked 3rd-party cookies.
* HTML and Markdown text in catalog item metadata, feature information, etc. is now formatted in a more typical way.  For example, text inside `<h1>` now looks like a heading.  Previously, most HTML styling was stripped out.
* Supports FeatureInfoTemplates on all catalog item types (previously only available on ImageryLayers).
* Apply markdown to properties shown in the Feature Info Panel.
* Add `includeCzml` option to CkanCatalogGroup.
* Fixed a bug that caused `WebMapServiceCatalogItem` to incorrectly populate the catalog item's metadata with data from GetCapabilities when another layer had a `Title` with the same value as the expected layer's `Name`.
* Update the default Australian topography basemap to Geoscience Australia's new worldwide layer (http://www.ga.gov.au/gisimg/rest/services/topography/National_Map_Colour_Basemap/MapServer)
* Allow color maps in CSV catalog items to be expressed as strings: colorMapString: "red-white-blue".
* Updated to [Cesium](http://cesiumjs.org) 1.15.  Significant changes relevant to TerriaJS users include:
  * Added support for the [glTF 1.0](https://github.com/KhronosGroup/glTF/blob/master/specification/README.md) draft specification.
  * Added support for the glTF extensions [KHR_binary_glTF](https://github.com/KhronosGroup/glTF/tree/master/extensions/Khronos/KHR_binary_glTF) and [KHR_materials_common](https://github.com/KhronosGroup/glTF/tree/KHR_materials_common/extensions/Khronos/KHR_materials_common).
  * `ImageryLayerFeatureInfo` now has an `imageryLayer` property, indicating the layer that contains the feature.
  * Make KML invalid coordinate processing match Google Earth behavior. [#3124](https://github.com/AnalyticalGraphicsInc/cesium/pull/3124)

### 1.0.46

* Fixed an incorrect require (`URIjs` instead of `urijs`).

### 1.0.45

* Major refactor of `CsvCatalogItem`, splitting region-mapping functionality out into `RegionProvider` and `RegionProviderList`. Dozens of new test cases. In the process, fixed a number of bugs and added new features including:
  * Regions can be matched using regular expressions, enabling matching of messy fields like local government names ("Baw Baw", "Baw Baw Shire", "Baw Baw (S)", "Shire of Baw Baw" etc).
  * Regions can be matched using a second field for disambiguation (eg, "Campbelltown" + "SA")
  * Drag-and-dropped datasets with a time column behave much better: rather than a fixed time being allocated to each row, each row occupies all the time up until the next row is shown.
  * Enumerated fields are colour coded in lat-long files, consist with region-mapped files.
  * Feedback is now provided after region mapping, showing which regions failed to match, and which matched more than once.
  * Bug: Fields with names starting with 'lon', 'lat' etc were too aggressively matched.
  * Bug: Numeric codes beginning with zeros (eg, certain NT 08xx postcodes) were treated as numbers and failed to match.
  * Bug: Fields with names that could be interpreted as regions weren't available as data variables.
* Avoid mixed content warnings when using the CartoDB basemaps.
* Allow Composite catalog items
* Handle WMS time interval specifications (time/time and time/time/periodicity)
* Moved `url` property to base CatalogItem base class.  Previously it was defined separately on most derived catalog items.
* Most catalog items now automatically expose a `dataUrl` that is the same as their `url`.
* Added custom definable controls to `CatalogMember`s.
  * To define a control, subclass `CatalogMemberControl` and register the control in `ViewModels/registerCatalogMemberControl` with a unique control name, control class and required property name.
  * If a `CatalogMember` has a property with the required property name either directly on the member or in its `customProperties` object, the control will appear in the catalog with the member and will fire the `activate` function when clicked.
  * Controls can be registered to appear on both the left and right side using `registerLeftSideControl` and `registerRightSideControl` respectively.
  * An example can be seen in the `CatalogMemberDownloadControl`
  * Currently top level members do not show controls.
* The `LocationBarViewModel` now shows the latitude and longitude coordinates of the mouse cursor in 2D as well as 3D.
* The `LocationBarViewModel` no longer displays a misleading elevation of 0m when in "3D Smooth" mode.
* Added `@menu-bar-right-offset` LESS parameter to control the right position of the menu bar.
* Added `forceProxy` flag to all catalog members to indicate that an individual item should use the proxy regardless of whether the domain is in the list of domains to proxy.
* Allow a single layer of an ArcGIS MapServer to be added through the "Add Data" interface.
* Added `WfsFeaturesCatalogGroup`.  This group is populated with a catalog item for each feature queried from a WFS server.
* The Feature Info panel now shows all selected features in an accordion control.  Previously it only showed the first one.
* Added `featureInfoTemplate` property to `CatalogItem`.  It is used to provide a custom Markdown or HTML template to display when a feature in the catalog item is clicked.  The template is parameterized on the properties of the feature.
* Updated to [Cesium](http://cesiumjs.org) 1.14.  Significant changes relevant to TerriaJS users include:
  * Fixed issues causing the terrain and sky to disappear when the camera is near the surface. [#2415](https://github.com/AnalyticalGraphicsInc/cesium/issues/2415) and [#2271](https://github.com/AnalyticalGraphicsInc/cesium/issues/2271)
  * Fixed issues causing the terrain and sky to disappear when the camera is near the surface. [#2415](https://github.com/AnalyticalGraphicsInc/cesium/issues/2415) and [#2271](https://github.com/AnalyticalGraphicsInc/cesium/issues/2271)
  * Provided a workaround for Safari 9 where WebGL constants can't be accessed through `WebGLRenderingContext`. Now constants are hard-coded in `WebGLConstants`. [#2989](https://github.com/AnalyticalGraphicsInc/cesium/issues/2989)
  * Added a workaround for Chrome 45, where the first character in a label with a small font size would not appear. [#3011](https://github.com/AnalyticalGraphicsInc/cesium/pull/3011)
  * Fixed an issue with drill picking at low frame rates that would cause a crash. [#3010](https://github.com/AnalyticalGraphicsInc/cesium/pull/3010)

### 1.0.44

* Fixed a bug that could cause timeseries animation to "jump" when resuming play after it was paused.
* Make it possible for catalog item initialMessage to require confirmation, and to be shown every time.
* When catalog items are enabled, the checkbox now animates to indicate that loading is in progress.
* Add `mode=preview` option in the hash portion of the URL.  When present, it is assumed that TerriaJS is being used as a previewer and the "small screen warning" will not be shown.
* Added `maximumLeafletZoomLevel` constructor option to `TerriaViewer`, which can be used to force Leaflet to allow zooming closer than its default of level 18.
* Added the `attribution` property to catalog items.  The attribution is displayed on the map when the catalog item is enabled.
* Remove an unnecessary instance of the Cesium InfoBox class when viewing in 2D
* Fixed a bug that prevented `AbsIttCatalogGroup` from successfully loading its list of catalog items.
* Allow missing URLs on embedded data (eg. embedded czml data)
* Fixed a bug loading URLs for ArcGIS services names that start with a number.
* Updated to [Cesium](http://cesiumjs.org) 1.13.  Significant changes relevant to TerriaJS users include:
  * The default `CTRL + Left Click Drag` mouse behavior is now duplicated for `CTRL + Right Click Drag` for better compatibility with Firefox on Mac OS [#2913](https://github.com/AnalyticalGraphicsInc/cesium/pull/2913).
  * Fixed an issue where non-feature nodes prevented KML documents from loading. [#2945](https://github.com/AnalyticalGraphicsInc/cesium/pull/2945)

### 1.0.43

* Fixed a bug that prevent the opened/closed state of groups from being preserved when sharing.

### 1.0.42

* Added a `cacheDuration` property to all catalog items.  The new property is used to specify, using Varnish-like notation (e.g. '1d', '10000s') the default length of time to cache URLs related to the catalog item.
* Fix bug when generating share URLs containing CSV items.
* Improve wording about downloading data from non-GeoJSON-supporting WFS servers.

### 1.0.41

* Improvements to `AbsIttCatalogItem` caching from the Tools menu.

### 1.0.40

* `ArcGisMapServerCatalogItem` now shows "NoData" tiles by default even after showing the popup message saying that max zoom is exceeded.  This can be disabled by setting its `showTilesAfterMessage` property to false.

### 1.0.39

* Fixed a race condition in `AbsIttCatalogItem` that could cause the legend and map to show different state than the Now Viewing UI suggested.
* Fixed a bug where an ABS concept with a comma in its name (e.g. "South Eastern Europe,nfd(c)" in Country of Birth) would cause values for concept that follow to be misappropriated to the wrong concepts.

### 1.0.38

* `AbsIttCatalogItem` now allows the region type to be set on demand rather than only at load time.
* `CsvCatalogItem` can now have no display variable selected, in which case all points are the same color.

### 1.0.37

* Added `CswCatalogGroup` for populating a catalog by querying an OGC CSW service.
* Added `CatalogMember.infoSectionOrder` property, to allow the order of info sections to be configured per catalog item when necessary.
* Fixed a bug that prevented WMTS layers with a single `TileMatrixSetLink` from working correctly.
* Added support for WMTS layers that can only provide tiles in JPEG format.
* Fixed testing and caching of ArcGis layers from tools and added More information option for imagery layers.
* TerriaJS no longer requires Google Analytics.  If a global `ga` function exists, it is used just as before.  Otherwise, events are, by default, logged to the console.
* The default event analytics behavior can be specified by passing an instance of `ConsoleAnalytics` or `GoogleAnalytics` to the `Terria` constructor.  The API key to use with `GoogleAnalytics` can be specified explicitly to its constructor, or it can be specified in the `parameter.googleAnalyticsKey` property in `config.json`.
* Made polygons drastically faster in 2D.
* TerriaJS now shortens share URLs by default when a URL shortener is available.
* Added Google Analytics reporting of the application URL.  This is useful for tracking use of share URLs.
* Added the ability to specify a specific dynamic layer of an ArcGIS Server using just a URL.

### 1.0.36

* Calculate extent of TopoJSON files so that the viewer correctly pans+zooms when a TopoJSON file is loaded.
* Fixed a bug that caused the `Terria#clock` to keep ticking (and therefore using CPU / battery) once started even after selecting a non-time-dynamic dataset.
* Fixed a bug that caused the popup message to appear twice when a dataset failed to load.
* Added layer information to the Info popup for WMS datasets.
* Added ability to filter catalog search results by:
  * type: `is:wms`, `-is:esri-mapserver`. A result must match any 'is:' and no '-is:'.
  * url: `url:vic.gov.au`, `-url:nicta.com.au`. A result must match any 'url:', and no '-url:'.
* Added ability to control the number of catalog search results: `show:20`, `show:all`

### 1.0.35

* Polygons from GeoJSON datasets are now filled.
* Left-aligned feature info table column and added some space between columns.
* Added `EarthGravityModel1996`.
* Extended `LocationBarViewModel` to show heights relative to a geoid / mean sea level model.  By default, EGM96 is used.
* Added support for styling GeoJSON files, either in catalog (add .style{} object) or embedded directly in the file following the [SimpleStyle spec](https://github.com/mapbox/simplestyle-spec).
* Fixed a bug that caused the 3D view to use significant CPU time even when idle.
* Added CartoDB's Positron and Dark Matter base maps to `createGlobalBaseMapOptions`.
* Added support for subdomains to `OpenStreetMapCatalogItem`.

### 1.0.34

* Fixed a bug that prevented catalog items inside groups on the Search tab from being enabled.
* Added `PopupMessageConfirmationViewModel`. It prevents the Popup from being closed unless the confirm button is pressed. Can also optionally have a deny button with a custom action.
* Added support for discovering GeoJSON datasets from CKAN.
* Added support for zipped GeoJSON files.
* Made `KmlCatalogItem` use the proxy when required.
* Made `FeatureInfoPanelViewModel` use the white panel background in more cases.
* Significantly improved the experience on devices with small screens, such as phones.
* Fixed a bug that caused only the portion of a CKAN group name before the first comma to be used.

### 1.0.33

* Added the `legendUrls` property to allow a catalog item to optionally have multiple legend images.
* Added a popup message when zooming in to the "No Data" scales of an `ArcGisMapServerCatalogItem`.
* Added `CatalogGroup.sortFunction` property to allow custom sorting of catalog items within a group.
* Added `ImageryLayerCatalogItem.treat403AsError` property.
* Added a title text when hovering over the label of an enabled catalog item.  The title text informs the user that clicking will zoom to the item.
* Added `createBingBaseMapOptions` function.
* Added an option to `KnockoutMarkdownBinding` to optionally skip HTML sanitization and therefore to allow unsafe HTML.
* Upgraded to Cesium 1.11.
* `CatalogItem.zoomTo` can now zoom to much smaller bounding box rectangles.

### 1.0.32

* Fixed CKAN resource format matching for KML, CSV, and Esri REST.

### 1.0.31

* Added support for optionally generating shorter URLs when sharing by using the Google URL shortening service.

### 1.0.30

* `WebMapServiceCatalogItem` and `ArcGisMapServerCatalogItem` now augment directly-specified metadata with metadata queried from the server.
* "Data Details" and "Service Details" on the catalog item info panel are now collapsed by default.  This improves the performance of the panel and hides some overly technical details.
* `ArcGisMapServerCatalogItem.layers` can now specify layer names in addition to layer IDs.  Layer names are matched in a case-insensitive manner and only if a direct ID match is not found.
* `itemProperties` are now applied through the normal JSON loading mechanism, so properties that are represented differently in code and in JSON will now work as well.
* Added support for `csv-geo-*` (e.g. csv-geo-au) to `CkanCatalogGroup`.
* The format name used in CKAN can now be specified to `CkanCatalogGroup` using the `wmsResourceFormat`, `kmlResourceFormat`, `csvResourceFormat`, and `esriMapServerResourceFormat` properties.  These properties are all regular expressions.  When the format of a CKAN resource returned from `package_search` matches one of these regular expressions, it is treated as that type within TerriaJS.
* `CkanCatalogGroup` now fills the `dataUrl` property of created items by pointing to the dataset's page on CKAN.
* The catalog item information panel now displays `info` sections in a consistent order.  The order can be overridden by setting `CatalogItemInfoViewModel.infoSectionOrder`.
* An empty `description` or `info` section is no longer shown on the catalog item information panel.  This can be used to remove sections that would otherwise be populated from dataset metadata.

### 1.0.29

* Add support for loading init files via the proxy when necessary.
* Switched to using the updated URL for STK World Terrain, `//assets.agi.com/stk-terrain/v1/tilesets/world/tiles`.

### 1.0.28

* Fixed a bug that prevented links to non-image (e.g. ArcGIS Map Server) legends from appearing on the Now Viewing panel.

### 1.0.27

* Use terriajs-cesium 1.10.7, fixing a module load problem in really old browers like IE8.

### 1.0.25

* Fixed incorrect date formatting in the timeline and animation controls on Internet Explorer 9.
* Add support for CSV files with longitude and latitude columns but no numeric value column.  Such datasets are visualized as points with a default color and do not have a legend.
* The Feature Information popup is now automatically closed when the user changes the `AbsIttCatalogItem` filter.

### 1.0.24

* Deprecated:
  * Renamed `AusGlobeViewer` to `TerriaViewer`.  `AusGlobeViewer` will continue to work until 2.0 but using it will print a deprecation warning to the browser console.
  * `BrandBarViewModel.create` now takes a single `options` parameter.  The container element, which used to be specified as the first parameter, should now be specified as the `container` property of the `options` parameter.  The old function signature will continue to work until 2.0 but using it will print a deprecation warning to the browser console.
* `WebMapServiceCatalogItem` now determines its rectangle from the GetCapabilities metadata even when configured to use multiple WMS layers.
* Added the ability to specify the terrain URL or the `TerrainProvider` to use in the 3D view when constructing `TerriaViewer`.
* `AbsIttCatalogItem` styles can now be set using the `tableStyle` property, much like `CsvCatalogItem`.
* Improved `AbsIttCatalogItem`'s tolerance of errors from the server.
* `NavigationViewModel` can now be constructed with a list of `controls` to include, instead of the standard `ZoomInNavigationControl`, `ResetViewNavigationControl`, and `ZoomOutNavigationControl`.
* Fixed a bug that caused the brand bar to slide away with the explorer panel on Internet Explorer 9.

### 1.0.23

* Fixed a bug that prevented features from being pickable from ABS datasets on the 2D map.
* Fixed a bug that caused the Explorer Panel tabs to be missing or misaligned in Firefox.

### 1.0.22

* Changed to use JPEG instead of PNG format for the Natural Earth II basemap.  This makes the tile download substantially smaller.

### 1.0.21

* Added an `itemProperties` property to `AbsIttCatalogGroup`.
* Added a `nowViewingMessage` property to `CatalogItem`.  This message is shown by the `NowViewingAttentionGrabberViewModel` when the item is enabled.  Each unique message is shown only once.

### 1.0.20

* Added the ability to specify SVG icons on Explorer Panel tabs.
* Added an icon to the Search tab.
* Added support for accessing Australian Bureau of Statistics data via the ABS-ITT API, using `AbsIttCatalogGroup` and `AbsIttCatalogItem`.
* The Now Viewing panel now contains controls for selecting which column to show in CSV datasets.

### 1.0.19

* Added `NowViewingAttentionGrabberViewModel`.  It calls attention the Now Viewing tab the first time a catalog item is enabled.
* Added `isHidden` property to catalog items and groups.  Hidden items and groups do not show up in the catalog or in search results.

### 1.0.18

* Added `featureInfoFields` property to `CsvCatalogItem.tableStyle`.  It allows setting which fields to show in the Feature Info popup, and the name to use for each.
* Added `OpenStreetMapCatalogItem` for connecting to tile servers using the OpenStreetMap tiling scheme.
* Added `CkanCatalogGroup.allowEntireWmsServers` property.  When set and the group discovers a WMS resource without a layer parameter, it adds a catalog item for the entire server instead of ignoring the resource.
* Added `WebMapTileServiceCatalogGroup` and `WebMapTileServiceCatalogItem` for accessing WMTS servers.
* Handle the case of an `ArcGisMapServerCatalogItem` with an advertised extent that is outside the valid range.
* We now pass ArcGIS MapServer metadata, when it's available, through to Cesium's `ArcGisMapServerImageryProvider` so that it doesn't need to re-request the metadata.
* Changed the style of the Menu Bar to have visually-separate menu items.
* Added support for SVG menu item icons to `MenuBarViewModel`.
* Improved popup message box sizing.

### 1.0.17

* Upgraded to TerriajS Cesium 1.10.2.
* Added `ImageryLayerCatalogItem.isRequiredForRendering`.  This is set to false by default and to true for base maps.  Slow datasets with `isRequiredForRendering=false` are less likely to prevent other datasets from appearing in the 3D view.
* The "Dataset Testing" functionality (on the hidden Tools menu accessible by adding `#tools=1` to the URL) now gives up tile requests and considers them failed after two seconds.  It also outputs some JSON that can be used as the `blacklist` property to blacklist all of the datasets that timed out.
* Added a feature to count the total number of datasets from the hidden Tools menu.
* Fixed a bug that caused the 2D / 3D buttons the Maps menu to get out of sync with the actual state of the map after switching automatically to 2D due to a performance problem.

### 1.0.16

* Deprecated:
  * `ArcGisMapServerCatalogGroup` has been deprecated.  Please use `ArcGisCatalogGroup` instead.
* Replaced Cesium animation controller with TerriaJS animation controller.
* Replaced Cesium Viewer widget with the CesiumWidget when running Cesium.
* Added the ability to turn a complete ArcGIS Server, or individual folders within it, into a catalog group using `ArcGisCatalogGroup`.

### 1.0.15

* Fix imagery attribution on the 2D map.

### 1.0.14

* Fixed share URL generation when the application is not running at the root directory of its web server.
* Fixed a bug that caused Internet Explorer 8 users to see a blank page instead of a message saying their browser is incompatible.

### 1.0.13

* Breaking changes:
  * Added a required `@brand-bar-height` property.
* `ExplorerPanelViewModel` can now be created with `isOpen` initially set to false.
* TerriaJS now raises an error and hides the dataset when asked to show an `ImageryLayerCatalogItem` in Leaflet and that catalog item does not use the Web Mercator (EPSG:3857) projection.  Previously, the dataset would silently fail to display.
* Improved error handling in `CzmlCatalogItem`, `GeoJsonCatalogItem`, and `KmlCatalogItem`.
* Made the `clipToRectangle` property available on all `ImageryProvider`-based catalog items, not just `WebMapServiceCatalogItem`.
* Added `CatalogMember.isPromoted` property.  Promoted catalog groups and items are displayed above non-promoted groups and items.
* Add support for ArcGIS MapServer "Raster Layers" in addition to "Feature Layers".

### 1.0.12

* Allow Esri ArcGIS MapServers to be added via the "Add Data" panel.
* Adds `baseMapName` and `viewerMode` fields to init files and share links. `baseMapName` is any base map name in the map settings panel and `viewerMode` can be set to `'2d'` or `'3d'`.
* Added `tableStyle.legendTicks` property to `CsvCatalogItem`.  When specified, the generated legend will have the specified number of equally-spaced lines with labels in its legend.

### 1.0.11

* Fixed a bug that prevented HTML feature information from showing up with a white background in Internet Explorer 9 and 10.
* Fixed a bug that prevented WMS GetCapabilities properties, such as CRS, from being properly inherited from the root layer.
* Tweaked credit / attribution styling.

### 1.0.10

* Added support for a developer attribution on the map.
* Fixed a bug that could cause results from previous async catalog searches to appear in the search results.

### 1.0.9

* Show Cesium `ImageryProvider` tile credits / attribution in Leaflet when using `CesiumTileLayer`.

### 1.0.8

* `WebMapServiceCatalogGroup` now populates the catalog using the hierarchy of layers returned by the WMS server in GetCapabilities.  To keep the previous behavior, set the `flatten` property to true.
* Potentially breaking changes:
  * The `getFeatureInfoAsGeoJson` and `getFeatureInfoAsXml` properties have been removed.  Use `getFeatureInfoFormats` instead.
* Added support for text/html responses from WMS GetFeatureInfo.
* Make the `FeatureInfoPanelViewModel` use a white background when displaying a complete HTML document.
* `KnockoutMarkdownBinding` no longer tries to interpret complete HTML documents (i.e. those that contain an <html> tag) as Markdown.
* The feature info popup for points loaded from CSV files now shows numeric columns with a missing value as blank instead of as 1e-34.
* `ArcGisMapServerCatalogItem` now offers metadata, used to populate the Data Details and Service Details sections of the catalog item info panel.
* `ArcGisMapServerCatalogGroup` now populates a "Service Description" and a "Data Description" info section for each catalog item from the MapServer's metadata.
* The `metadataUrl` is now populated (and shown) from the regular MapServer URL.
* Added 'keepOnTop' flag support for imageryLayers in init file to allow a layer to serve as a mask.
* Added 'keepOnTop' support to region mapping to allow arbitrary masks based on supported regions.
* Checkboxes in the Data Catalogue and Search tabs now have a larger clickable area.

### 1.0.7

* `CatalogItemNameSearchProviderViewModel` now asynchronously loads groups so items in unloaded groups can be found, too.
* Do not automatically fly to the first location when pressing Enter in the Search input box.
* Changed `ArcGisMapServerCatalogItem` to interpret a `maxScale` of 0 from an ArcGIS MapServer as "not specified".
* Added an `itemProperties` property to `ArcGisMapServerCatalogGroup`, allowing properties of auto-discovered layers to be specified explicitly.
* Added `validDropElements`, `validDropClasses`, `invalidDropElements`, and `invalidDropClasses` properties to `DragDropViewModel` for finer control over where dropping is allowed.
* Arbitrary parameters can now be specified in `config.json` by adding them to the `parameters` property.


### 1.0.6

* Added support for region mapping based on region names instead of region numbers (example in `public/test/countries.csv`).
* Added support for time-dynamic region mapping (example in `public/test/droughts.csv`).
* Added the ability to specify CSV styling in the init file (example in `public/init/test.json`).
* Improved the appearance of the legends generated with region mapping.
* Added the ability to region-map countries (example in `public/test/countries.csv`).
* Elminated distracting "jumping" of the selection indicator when picking point features while zoomed in very close to the surface.
* Fixed a bug that caused features to be picked from all layers in an Esri MapServer, instead of just the visible ones.
* Added support for the WMS MinScaleDenominator property and the Esri MapServer maxScale property, preventing layers from disappearing when zoomed in to close to the surface.
* Polygons loaded from KML files are now placed on the terrain surface.
* The 3D viewer now shows Bing Maps imagery unmodified, matching the 2D viewer.  Previously, it applied a gamma correction.
* All catalog items now have an `info` property that allows arbitrary sections to be shown for the item in the info popup.
* `CkanCatalogGroup` now has a `groupBy` property to control whether catalog items are grouped by CKAN group ("group"), CKAN organization ("organization"), or not grouped at all ("none").
* `CkanCatalogGroup` now has a `useResourceName` property to control whether the name of the catalog item is derived from the resource (true), or the dataset itself (false).
* The catalog item info page now renders a much more complete set of Markdown and HTML elements.
