# Change Log

#### next release (0.4.7)

- Upgrade terriajs-server to version 5 alpha
  - Requires node version 22 or above
  - Comes with a new version of proxy rewritten using undici instead of deprecated `request` package. This should improve the performance and reliability of the proxy. Please test your map with this new version of terriajs-server and report any issues you find.
  - For full changelog see [terriajs-server CHANGES.md](https://github.com/TerriaJS/terriajs-server/blob/master/CHANGES.md#next-release---unreleased)

#### 0.4.6

- Upgrades TerriaJS to [8.12.2](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#8120---2026-03-27)

#### 0.4.5

- Upgrades TerriaJS to [8.11.3](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#8113---2026-02-02)

#### 0.4.4

**2025-12-04**

- **Security fixes**
  - Fixed a security bug in `/proxy` endpoint that allowed requests to a variation of domains in the `allowProxyFor` list. If `example.com` is in `allowProxyFor` setting, this allowed requests to a domain with a different prefix, like `badexample.com` to pass through. [#212](https://github.com/TerriaJS/terriajs-server/pull/212)

- **Deprecations**
  - Deprecates most of the proxy domains in the [default serverconfig.json](https://github.com/TerriaJS/TerriaMap/blob/d126a10a0625926762351b1b44b918fb03737836/serverconfig.json#L7-L25) file. These will be removed in a future release, so please add them through a [custom serverconfig.json](https://docs.terria.io/guide/getting-started/#customizing-terriamap) if you rely on terria proxying to any of these servers.

- Upgrades TerriaJS to
  [8.11.1](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#8111---2025-12-04)

#### 0.4.3

**2025-10-09**

- Update TerriaJS to [8.11.0](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#8110---2025-10-09)

#### 0.4.2

**2025-06-03**

- Update TerriaJS to [8.9.5](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#895---2025-06-03)
- Update terriajs-server to [4.0.2](https://github.com/TerriaJS/terriajs-server/blob/master/CHANGES.md#402---2025-06-03)

#### 0.4.1

**2025-04-24**

- Update TerriaJS to `8.9.3`
  - Contains a fix for region mapping and GeoJSON rendering.
  - Read full [list of changes](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#893---2025-04-24)

#### 0.4.0

**2025-04-04**

- **Breaking changes:**
  - Update TerriaJS to `8.9.2`
    - New features
      - This release has a new look UI with changes to workbench and other panels
      - Tiling support for ArcGIS feature service. This is enabled by default if the server supports tiling and unsupported marker/point styles aren't used - [PR 7370](https://github.com/TerriaJS/terriajs/pull/7370)
    - Bug fixes
      - Fixes a regression bug in GeoJSON rendering that caused some features to be not rendered - [PR 7144](https://github.com/TerriaJS/terriajs/pull/7144)
    - [Full list of TerriaJS changes](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#892---2025-03-31)

#### 0.3.0

**2025-02-18**

- **Breaking changes:**
  - Updated TerriaJS to `8.8.0`
    - Upgrades Webpack to version 5
    - Upgraded sass to version 1.80+
    - [Full list of TerriaJS changes](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#880---2025-02-18)
  - Converted files from CJS to ESM style
    - This includes `entry.js`, `index.js` - if you have changed these files it is likely that you will get a merge conflict when upgrading. Please [reach out to us](https://github.com/terriajs/terriajs/discussions) if you need help.
    - Replaced webpack aliases `~terriajs-variables` and `~terriajs` in css imports with relative paths. This simplifies the webpack configuration.

#### 0.2.4

**2024-12-19**

- Updated TerriaJS to `8.7.11`
  - Add `clampToGround` to `KmlCatalogItemTraits`
  - Add `dataSourceUri` to `KmlCatalogItemTraits`

#### 0.2.3

**2024-11-29**

- Updated TerriaJS to `8.7.10`
  - Added OpenStreetMap as a default map
  - Upgraded gulp to version 5
    - Gulp 5 defaults to encoding copied files as utf-8, had turn off encoding by setting `encoding: false` to correctly copy binary assets from dependencies.
  - Bunch of other packages upgraded, [see CHANGES](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#8710---2024-11-29).

### `0.2.2`

**2024-11-22**

- Updated TerriaJS to `8.7.9`.
  - **Breaking changes:**
    - Removed the basemaps - positron, darkmatter and black-marble - from the default settings. The Carto ones are no longer free and requires an [Enterprise or Grantee license](https://carto.com/basemaps). If you have the appropriate license you can add them via your [initialization file](https://docs.terria.io/guide/customizing/initialization-files/#basemaps). [Example configuration](https://gist.github.com/na9da/ef7871afee7cbe3d0a95e5b6351834c9).
  - Added [I3SCatalogItem](https://docs.terria.io/guide/connecting-to-data/catalog-type-details/i3s/)
  - Added [CogCatalogItem](https://docs.terria.io/guide/connecting-to-data/catalog-type-details/cog/)

### `0.2.1`

**2024-08-07**

- Updated TerriaJS to `8.7.5`.

### `0.1.2`

**2024-05-02**

- Updated TerriaJS to `8.7.1`.

### `0.1.1`

**2024-03-05**

- Updated TerriaJS to `8.5.1`.
  - **Breaking changes:**
    - **Upgraded Cesium to version 6.2.0**
    - **Upgraded Typescript to version 5.2.x**
  - For full list of changes, see [terriajs/CHANGES.md](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md)
- Replaced `node-sass` with `sass`. (both packages expose the same JavaScript API, so no changes should be required)
- Increase NodeJS minimum version to 16

### ~`0.1.0`~

**2024-02-08**

Failed release workflow

### `0.0.9`

**2023-11-24**

- Updated TerriaJS to `8.3.9`.
- Moved to new Search Provider model. Search Providers are now configured in `config.json` `searchProviders`. For example configuration see https://docs.terria.io/guide/customizing/search-providers/

### `0.0.8`

**2023-08-11**

- Updated TerriaJS to `8.3.2`.
  - Now supports Google Analytics 4 properties.
  - Upgraded babel packages
  - See [the full list of changes](https://github.com/TerriaJS/terriajs/blob/main/CHANGES.md#832---2023-08-11).

### `0.0.7`

**2023-05-22**

- Update TerriaJS to `8.3.0`
  - **Breaking changes:**
    - **Upgraded Mobx to version 6.7.x**
    - **Upgraded Typescript to version 4.9.x**

- Make `version.js` more detailed. It now uses format `${date}-${TerriaMap version}-${TerriaJS version}-${TerriaMap commit hash}`
- Also write out new `wwwroot/version.json` file - for example `{"date":"2022-11-11","terriajs":"8.2.21","terriamap":"0.0.6","terriamapCommitHash":"2d4d8d7d","hasLocalModifications":true}`

### `0.0.6`

**2022-11-11**

- About button href is now pulled from TerriaJS `configParameters.aboutButtonHrefUrl`
- Update TerriaJS to `8.2.21`

### `0.0.5`

**2022-11-02**

- TerriaMap no longer supports ejs templating for data sources. We suggest to use terria reference to manage a catalog in multiple files.
- Update TerriaJS to `8.2.20`
- Pin `"@types/lodash": "4.14.182"`(See https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/63021)

### `0.0.4`

**2022-09-23**

- Removed `RelatedMaps.jsx` - this is now generated from configuration in `terriajs`. See https://github.com/TerriaJS/terriajs/blob/main/doc/customizing/client-side-config.md#parameters for example configuration.
  - **Note** `RelatedMaps` can remain unchanged if HTML/JSX file is preferred.

### 2022-06-30

- Add support Plugins support using `terriajs-plugin-api`. See [`plugins.ts`](./plugins.ts)

### 2022-05-31

**Breaking changes:**

- TerriaMap no longer merges `lib/Language/en/translation.json` with terriajs' translation file. You should now use `wwwroot/languages/{{lng}}/languageOverrides.json` to override strings in terriajs' translation file(s) or to add additional strings for your map.

### 2022-03-14

**Breaking changes:**

- Removed `wwwroot/index.html`.
- Added gulp task `gulp render-index`. This builds `wwwroot/index.html` from the template `wwwroot/index.ejs` with a `<base href="${baseHref}">` tag set via commnd line parameter. The following tasks all call `render-index`:
  - `default` (i.e. calling `gulp` without a task)
  - `build`
  - `release`
  - `watch`
- Example usage: `gulp build --baseHref="/map/"` if your TerriaMap is deployed at http://example.com/map/

### 2021-09-27

- Disabled sourcemaps for production builds. To re-enable for your specific application, set "devtool" to 'source-map' in buildprocess/webpack.config.js

### MobX Development

- Fix manifest.json start_url
- Move About & Related Maps to left hand side
- Default to console analytics in development
- Allow translation overrides via gulp
- Re-enabled disclaimer via newly ported disclaimer component
- Re-enabled measure tool
- Development builds sped up by 3~20x - ts-loader is now optional & TypeScript being transpiled by babel-loader, keeping type check safety on a separate thread
- Added default help content & `languageOverrides.json` for i18n
- Add back updateApplicationOnMessageFromParentWindow
- Update youtube urls to nocookie version
- Removed cancel/deny button from global disclaimer unless `globalDisclaimer.afterDenyLocation` is set with a website to navigate to.

- Fix manifest.json start_url

### Next Release

- Fix the hot reload script.

### 2017-XX-XX

- Use `gtar` when building `make-package` on OSX to create GNU tar compatible tarballs.
- Change deafult mobile view mode to a configuration parameter rather then hard coded to 2D.
- Add Augmented Reality mode for iOS and Android devices with a compass and accelerometer, activated by enabling `experimentalFeatures` in `config.json` and adding the AugmentedVirtualityTool to the ExperimentalMenu in the customisable user interface.

### 2016-11-15

- Fixed link to NEII viewer in Related Maps.

### 2016-07-15

- Catalog (init) files can now be stored as .ejs files in /datasources, rendered by the EJS templating library. See comments in gulpfile.js.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 4.0.2. Significant changes relevant to NationalMap users include:
  - A brand new user interface, incorporating user feedback and the results of usability testing!
  - `CswCatalogGroup` will now include Web Processing Services from the catalog if configured with `includeWps` set to true.
  - `WebMapServiceCatalogItem` will now detect ncWMS servers and set isNcWMS to true.
  - Uses a new mechanism for storing the data associated with the Share feature, avoid URL length limits.
  - Added partial support for the SDMX-JSON format.

### 2016-06-15

- Added a prominent link to the preview of the new UI.
- Added GNAF as a location search provider.
- Fixed an issue where the 404 error page would display incorrectly if given a non-existent path (eg, nationlmap.gov.au/nonexistent/path)
- Added CNT3 as an alias for ISO3 as a csv column name (for three-letter country codes).
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 3.3.0. Significant changes relevant to NationalMap users include:
  - `CkanCatalogItem.createCatalogItemFromResource`'s `options.allowGroups` has been replaced with `options.allowWmsGroups` and `options.allowWfsGroups`.
  - Added support for WFS in CKAN items.
  - Fixed a bug that prevented the terriajs-server's `"proxyAllDomains": true` option from working.
  - Added support in FeatureInfoTemplate for referencing CSV columns by either their name in the CSV file, or the name they are given via `TableStyle.columns...name` (if any).
  - Improved CSV handling to ignore any blank lines, ie. those containing only commas.
  - Fixed a bug in `CswCatalogGroup` that prevented it from working in Internet Explorer.
  - Fixed a bug on IE9 that prevented shortened URLs from loading.
  - Fixed a map started with smooth terrain being unable to switch to 3D terrain.
  - Fixed a bug in `CkanCatalogItem` that prevented it from using the proxy for dataset URLs.
  - Fixed feature picking when displaying a point-based vector and a region mapped layer at the same time.
  - Stopped generation of WMS intervals being dependent on JS dates and hence sensitive to daylight savings time gaps.
  - Fixed a bug that led to zero property values being considered time-varying in the Feature Info panel.
  - Fixed a bug that prevented lat/lon injection into templates with time-varying properties.
  - Add `parameters` property in `WebFeatureServiceCatalogItem` to allow accessing URLs that need additional parameters.
  - Fixed a bug where visiting a shared link with a time-series layer would crash on load.
  - Added a direct way to format numbers in feature info templates, eg. `{{#terria.formatNumber}}{"useGrouping": true, "maximumFractionDigits": 3}{{value}}{{/terria.formatNumber}}`. The quotes around the keys are optional.
  - When the number of unique values in a CSV column exceeds the number of color bins available, the legend now displays "XX other values" as the label for the last bucket rather than simply "Other".
  - CSV columns with up to 21 unique values can now be fully displayed in the legend. Previously, the number of bins was limited to 9.
  - Added `cycle` option to `tableColumnStyle.colorBinMethod` for enumeration-type CSV columns. When the number of unique values in the column exceeds the number of color bins available, this option makes TerriaJS color all values by cycling through the available colors, rather than coloring only the most common values and lumping the rest into an "Other" bucket.
  - Metadata and single data files (e.g. KML, GeoJSON) are now consistently cached for one day instead of two weeks.
  - `WebMapServiceCatalogItem` now uses the legend for the `style` specified in `parameters` when possible. It also now includes the `parameters` when building a `GetLegendGraphic` URL.
  - Fixed a bug that prevented switching to the 3D view after starting the application in 2D mode.

### 2016-06-15

- Support "globalDisclaimer" configuration option, defined as follows

```json
  "globalDisclaimer": {
  "confirmationRequired": true, // Whether user must click the correct button to dismiss it (otherwise click anywhere)
  "buttonTitle": "I agree", // Text for that button (defaults to "Ok").
  "title": "Disclaimer", // Title for the window
  "prodHostRegex": "gov.\\.au$", // If this regular expression is NOT matched, add the DevelopmentDisclaimerPreamble.html
  "devHostRegex-OPTIONAL": "\\b(staging|preview|test|dev)\\.", // If this regular expression IS matched, add that preamble
  "enableOnLocalhost": true // By default, Disclaimers are not shown when testing locally. Add this to test your disclaimer.
  }
```

### 2016-05-13b

- Fixed a bug in the build configuration that allowed extra whitespace to be inserted in multi-line strings. This whitespace could case the markdown formatter to treat the string as preformatted text and break, e.g., error messages.

### 2016-05-13

- Breaking changes:
  - Columns with the name `ced_aec` are no longer supported for region mapping. Please use `com_elb_code` or `com_elb_name` instead.
- Added new region types for region mapping:
  - Commonwealth electoral divisions 2016 by ID, from the Australian Electoral Commission: (column names: `divisionnm`, `com_elb_name_2016`, or `com_elb_name`)
  - Commonwealth electoral divisions 2016 by name, from the Australian Electoral Commission: (column names: `divisionid`, `com_elb_code_2016`, `com_elb_code`, or `com_elb`)
  - Natural resource management regions by ID (column names: `nrmr`, `nrmr_code`, or `nrmr_code_2011`)
  - Natural resource management regions by name (column name: `nrmr_name`)
  - Australian drainage divisions by ID (column names: `add`, `add_code`, `add_code_2011`)
  - Australian drainage divisions by name (column name: `add_name`)
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 3.1.0. Significant changes relevant to NationalMap users include:
  - Injected clicked lat and long into templates under `{{terria.coords.latitude}}` and `{{terria.coords.longitude}}`.
  - Fixed an exception being thrown when selecting a region while another region highlight was still loading.
  - Added `CesiumTerrainCatalogItem` to display a 3D surface model in a supported Cesium format.
  - Added support for configuration of how time is displayed on the timeline - catalog items can now specify a dateFormat hash
    in their configuration that has formats for `timelineTic` (what is displayed on the timeline itself) and `currentTime`
    (which is the current time at the top-left).
  - Fixed display when `tableStyle.colorBins` is 0.
  - Added `fogSettings` option to init file to customize fog settings, introduced in Cesium 1.16.
  - Improved zooming to csvs, to include a small margin around the points.
  - Support ArcGIS MapServer extents specified in a wider range of projections, including GDA MGA zones.
  - WMS legends now use a bigger font, include labels, and are anti-aliased when we can determine that the server is Geoserver and supports these options.
  - Added support for time-series data sets with gaps - these are skipped when scrubbing on the timeline or playing.
  - Only trigger a search when the user presses enter or stops typing for 3 seconds. This will greatly reduce the number of times that searches are performed, which is important with a geocoder like Bing Maps that counts each geocode as a transaction.
  - Reduced the tendency for search to lock up the web browser while it is in progress.
  - For WMS catalog items that have animated data, the initial time of the timeslider can be specified with `initialTimeSource` as `start`, `end`, `present` (nearest date to present), or with an ISO8601 date.
  - Added ability to remove csv columns from the Now Viewing panel, using `"type": "HIDDEN"` in `tableStyle.columns`.
  - Updated to [Cesium](http://cesiumjs.org) 1.20. Significant changes relevant to TerriaJS users include:
    - Fixed loading for KML `NetworkLink` to not append a `?` if there isn't a query string.
    - Fixed handling of non-standard KML `styleUrl` references within a `StyleMap`.
    - Fixed issue in KML where StyleMaps from external documents fail to load.
    - Added translucent and colored image support to KML ground overlays
    - `GeoJsonDataSource` now handles CRS `urn:ogc:def:crs:EPSG::4326`
    - Fix a race condition that would cause the terrain to continue loading and unloading or cause a crash when changing terrain providers. [#3690](https://github.com/AnalyticalGraphicsInc/cesium/issues/3690)
    - Fix issue where the `GroundPrimitive` volume was being clipped by the far plane. [#3706](https://github.com/AnalyticalGraphicsInc/cesium/issues/3706)
    - Fixed a reentrancy bug in `EntityCollection.collectionChanged`. [#3739](https://github.com/AnalyticalGraphicsInc/cesium/pull/3739)
    - Fixed a crash that would occur if you added and removed an `Entity` with a path without ever actually rendering it. [#3738](https://github.com/AnalyticalGraphicsInc/cesium/pull/3738)
    - Fixed issue causing parts of geometry and billboards/labels to be clipped. [#3748](https://github.com/AnalyticalGraphicsInc/cesium/issues/3748)
    - Fixed bug where transparent image materials were drawn black.
    - Fixed `Color.fromCssColorString` from reusing the input `result` alpha value in some cases.

### 2016-05-15

- Detect when an old version of Node.js is being used, and fail helpfully.

### 2016-04-15

- Updated the URLs for the Water Observations from Space datasets to `geoserver.nci.org.au`.
- Split catalog into a separate module. The catalog is now managed through github.com/TerriaJS/NationalMap-Catalog.
- Split client-side configuration (config.json) from server-side (devserverconfig.json). Using Terria-Server 2.0.0 enables
  the catalog separation described above.
- Added missing CED2 regionmap id file.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 2.3.0. Significant changes relevant to NationalMap users include:
  - Share links now contain details about the picked point, picked features and currently selected feature.
  - Fixed a bug that could cause catalog items to be loaded multiple times.
  - Added support for the `copyrightText` property for ArcGIS layers - this now shows up in info under "Copyright Text".
  - Showed a message in the catalog item info panel that informs the user that a catalog item is local and can't be shared.
  - TerriaJS now obtains its list of domains that the proxy will proxy for from the `proxyableDomains/` service. The URL can be overridden by setting `parameters.proxyableDomainsUrl` in `config.json`.
  - Improved legend and coloring of ENUM (string) columns of CSV files, to sort first by frequency, then alphabetically.

### 2016-03-29

- Use terriajs-server 1.4.1 to fix a bug that caused all headers - even the ones meant to be excluded - to be passed to the remote server by the proxy service. This broke the Western Australian Government datasets in the Geoscience Australia deployment architecture.

### 2016-03-15

- Updated "Population Estimates" layer to point to new GA location.
- Changed the query of the South Australian Government CKAN server to include datasets with a format of both `geojson` and `GeoJSON`, greatly increasing the number of datasets found.
- Updated all Geoscience Australia layers to point to the new infrastructure at http://services.ga.gov.au/gis/rest/services .
- Re-populated Western Australian Government group, now pulling directly from `catalogue.beta.data.wa.gov.au`.
- Added pages for HTTP 404 (Not Found) and 500 (Internal Server Error). Previously, we redirected errors back to the main page without an explanation.
- Added Brisbane City Council group under Data Providers.
- Added direct download links for several ABS national boundaries.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 2.2.0. Significant changes relevant to NationalMap users include:
  - Warn user when the requested WMS layer doesn't exist, and try to provide a suggestion.
  - Fixed the calculation of a CSV file's extent so that missing latitudes and longitudes are ignored, not treated as zero.
  - Improved the user experience around uploading files in a format not directly supported by TerriaJS and optionally using the conversion service.
  - Improved performance of large CSV files, especially the loading time, and the time taken to change the display variable of region-mapped files.
  - Added support for CSV files with only location (lat/lon or region) columns, and no value columns, using a file-specific color. Revised GeoJSON display to draw from the same palette of colors.
  - Fixed a bug that prevented GeoJSON styles from being applied correctly in some cases.
  - Fixed an error when adding a CSV with one line of data.
  - Fixed error when adding a CSV file with numeric column names.
  - Polygons and polylines are now highlighted on click when the geometry is available.
  - Improved legend and coloring of ENUM (string) columns of CSV files; only the most common values are colored differently, with the rest shown as 'Other'.
  - Changed `tableStyle`'s `format` to only accept `useGrouping`, `maximumFractionDigits` and `styling: "percent"` options. Previously some other options may have worked in some browsers.
  - Improved color palette for string (ENUM) columns of CSV files.
  - Improved CSV loading to ignore any completely blank lines after the header row (ie. lines which do not even have commas).
  - Added support for grouping catalog items retrieved from a CSW server according to criteria specified in the init file (via the `metadataGroups` property) or from a `domainSpecification` and a call to the `GetDomain` service on the CSW server.
  - Improved ABS display (to hide the regions) when a concept is deselected.
  - Improved readability of ArcGIS catalog items and legends by replacing underscores with spaces.
  - `ArcGisMapServerCatalogItem` metadata is now cached by the proxy for only 24 hours.
  - Improved the feature info panel to update the display of time-varying region-mapped CSV files for the current time.
  - Fixed sharing of time-varying CZML files; the timeline was not showing on the shared link.
  - Fixed sharing of user-added time-varying CSV files.
  - Fixed a bug in `CkanCatalogItem` that made it build URLs incorrectly when given a base URL ending in a slash.
  - Added column-specific styling to CSV files, using a new `tableStyle.columns` json parameter. This is an object whose keys are column names or indices, and whose values are objects of column-specific tableStyle parameters. See the CSV column-specific group in `wwwroot/test/init/test-tablestyle.json` for an example. [#1097](https://github.com/TerriaJS/terriajs/issues/1097)
  - Added the following column-specific `tableStyle` parameters:
    - `name`: renames the column.
    - `type`: sets the column type; can be one of LON, LAT, ALT, TIME, SCALAR, or ENUM.
    - `format`: sets the column number format, using the format of the [Javascript Intl options parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString), eg. `{"format": {"useGrouping": true, "maximumFractionDigits": 2}}` to add thousands separators to numbers and show only two decimal places. Only the `useGrouping`, `maximumFractionDigits` and `styling: "percent"` options are guaranteed to work in all browsers.
  - Added column-specific formatting to the feature info panel for all file types, eg. `"featureInfoTemplate" : {"template": "{{SPEED}} m/s", "formats": {"SPEED": {"maximumFractionDigits": 2}}}`. The formatting options are the same as above.
  - Changed the default number format in the Feature Info Panel to not separate thousands with commas.
  - Fixed a bug that caused the content on the feature info panel to be rendered as pure HTML instead of as mixed HTML / Markdown.
  - Changed the default for `tableStyle.replaceWithZeroValues` to `[]`, ie. nothing.
  - Changed the default for `tableStyle.replaceWithNullValues` to `["-", "na", "NA"]`.
  - Changed the default for `tableStyle.nullLabel` to '(No value)'.
  - Fixed showWarnings in config json not being respected by CSV catalog items.
  - Fixed hidden region mapped layers being displayed when variable selection changes.
  - Fixed exporting raw data as CSV not escaping commas in the data itself.
  - Updated to [Cesium](http://cesiumjs.org) 1.18. Significant changes relevant to TerriaJS users include:
    - Improved terrain performance by up to 35%. Added support for fog near the horizon, which improves performance by rendering less terrain tiles and reduces terrain tile requests. [#3154](https://github.com/AnalyticalGraphicsInc/cesium/pull/3154)
    - Reduced the amount of GPU and CPU memory used by terrain by using compression. The CPU memory was reduced by up to 40%, and approximately another 25% in Chrome.
    - Fixed an issue where the sun texture is not generated correctly on some mobile devices. [#3141](https://github.com/AnalyticalGraphicsInc/cesium/issues/3141)
    - Cesium now honors window.devicePixelRatio on browsers that support the CSS imageRendering attribute. This greatly improves performance on mobile devices and high DPI displays by rendering at the browser-recommended resolution. This also reduces bandwidth usage and increases battery life in these cases.

### 2016-02-15

- Removed the datasets in the "ACT Government" and "Western Australian Government" groups because they were not working. ACT broke as a result of a change in the Socrata software used to manage their catalog in January. WA broke as a result of the retirement of Google Maps Engine in December.
- Several catalog items (`Mobile Black Spot Database` and `Mobile Black Spot Programme - Funded Base Stations` in `Communications`, `Catchment Scale Land Use 2015` in `Land`, and `Taxation Statistics 2011-201` and `Medicare Offices` in `Social and Economic`) now point directly to the corresponding dataset on data.gov.au and get their metadata from there, instead of pointing to a WMS server or GeoJSON file.
- The Australian Goverernment logos have been moved to the top-left part of the About page.
- References to "NICTA" have been replaced by "Data61" in the help pages.
- The privacy policy link on the Privacy page now links to the policy on `dpmc.gov.au` instead of `communications.gov.au`.
- The statistical boundary catalogue items now have direct download links to the ABS-provided shapefiles on their info pages.
- The `National Data Sets -> Elevation -> SRTM 1 sec DEM Image` catalogue item now points to the new service at `services.ga.gov.au` instead of the old one at `www.ga.gov.au`.
- Added the 2013 versions of the Local Government Area (LGA), Commonwealth Electoral Division (CED), and Tourism Regions (TR) boundaries for region mapping.
- The data source editor, previously at `terria.io/DataSourceEditor` is now available with NationalMap at `/editor`. This way it will track the version of the catalogue format currently used by NationalMap.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 2.0.1. Significant changes relevant to NationalMap users include:
  - Region mapping now works with CSV files containing a postcode column in which the leading zero is missing (e.g. `830` instead of `0830`).
  - Clicking inside a region with no value in a region-mapped CSV will now report "No features found" instead of showing a mysterious blank feature info window.
  - More date formats are now supported in CSV files, including `YYYY`, `YYYY-MM`, and `YYYY-MM-DD HH:MM(:SS)`
  - Improved the formatting of dates/times from CSV files in the feature info panel.
  - Added 5 new options to the `tableStyle` property for CSV catalog items, including `replaceWithZeroValues`, `replaceWithNullValues`, `nullColor`, `nullLabel`, and `timeColumn`. See the TerriaJS changelog linked above for details.
  - CSV columns containing only HTML tags are no longer shown as a possible Data Variable on the Now Viewing tab.
  - Greatly improved backward compatibility for share links. Share links can now continue to work even if an enabled catalog item is moved or renamed.
  - We now generate a nice legend image for ArcGIS MapServer catalogue items instead of simply providing a link to the server-provided HTML file.
  - Legends for CSV, ABS, and ArcGIS MapServer catalogue items are now generated in SVG format.
  - Added `CkanCatalogItem`, which can be used to reference a particular resource of any compatible type on a CKAN server.
  - Fixed Leaflet feature selection when zoomed out enough that the world is repeated.
  - Improved the handling of lat/lon CSV files with missing latitude or longitude values.
  - Fixed a bug that prevented `SocrataCatalogGroup` from working in Internet Explorer 9.
  - Fixed a bug that caused the Now Viewing tab to display incorrectly in Internet Explorer 11 when switching directly to it from the Data Catalogue tab.

### 2016-01-19

- Fixed incorrect claims in the documentation that NationalMap was funed by the Department of Prime Minister and Cabinet.

### 2016-01-15

- Removed `National Data Sets -> Land -> Catchment Scale Land Use 2014`.
- Removed hardcoded descriptions from the Mobile Black Spot datasets, allowing descriptions provided by the server to be used instead.
- Split out server-side code into a separate repo, github.com/TerriaJS/terriajs-server and NPM package 'terriajs-server'.
- Remove Supervisor and Forever, as they're basically redundant.
- Reworked "npm start" and "npm stop" so they start/stop TerriaJS-Server in the background.
- The disclaimer no longer overlaps with the map credits when printing the 2D view in Chrome.
- Fixed the City of Melbourne datasets. An upgrade of their Socrata server broke functionality we relied on.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.53. Significant changes relevant to NationalMap users include:
  - Fixed a typo that prevented clearing the search query on the Search tab.
  - Added a progress bar to the top of the map, indicating tile download progress.
  - We no longer show the entity's ID (which is usually a meaningless GUID) on the feature info panel when the feature does not have a name. Instead, we leave the area blank.
  - Fixed a bug with time-dynamic imagery layers that caused features to be picked from the next time to be displayed, in addition to the current one.
  - `Cesium.zoomTo` now takes the terrain height into account when zooming to a rectangle.
  - Dramatically improved the performance of region mapping.
  - Introduced new quantisation (color binning) methods to dramatically improve the display of choropleths (numerical quantities displayed as colors) for CSV files, instead of always using linear. Four values for `colorBinMethod` are supported:
    - "auto" (default), usually means "ckmeans"
    - "ckmeans": use "CK means" method, an improved version of Jenks Even Breaks to form clusters of values that are as distinct as possible.
    - "quantile": use quantiles, evenly distributing values between bins
    - "none": use the previous linear color mapping method.
  - The default style for CSV files is now 7 color bins with CK means method.
  - Added support for color palettes from Color Brewer (colorbrewer2.org). Within `tableStyle`, use a value like `"colorPalette": "10-class BrBG"`.
  - Improved the display of legends for CSV files.
  - Added support for the Socrata "new backend" with GeoJSON download to `SocrataCatalogGroup`.
  - Improved compatibility with Internet Explorer 9.

### 2015-12-15

- Added Department of Environment datasets under `National Data Sets -> Environment`.
- Added Soil and Landscape Grid data under `National Data Sets -> Land`.
- Add NEII Viewer and AURIN Map to Related Maps.
- Fixed display of map preview images in Related Maps.
- Fixed the squished images on the Related Maps panel.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.50. Significant changes relevant to NationalMap users include:
  - Fixed a bug that caused poor performance when clicking a point on the map with lots of features and then closing the feature information panel.
  - Legend URLs are now accessed via the proxy, if applicable.
  - Fixed a bug that caused a `TypeError` on load when the share URL included enabled datasets with an order different from their order in the catalog.
  - Improved the message that is shown to the user when their browser supports WebGL but it has a "major performance caveat".
  - Fixed a bug that could cause an exception in some browsers (Internet Explorer, Safari) when loading a GeoJSON with embedded styles.
  - Fixed a bug with Leaflet 2D map where clicks on animation controls or timeline would also register on the map underneath causing undesired feature selection and, when double clicked, zooming (also removed an old hack that disabled dragging while using the timeline slider)
  - Changed Australian Topography base map server and updated the associated thumbnail.
  - Added `updateApplicationOnMessageFromParentWindow` function. After an app calls this function at startup, TerriaJS can be controlled by its parent window when embedded in an `iframe` by messages sent with `window.postMessage`.
  - Put a white background behind legend images to fix legend images with transparent background being nearly invisible.
  - Search entries are no longer duplicated for catalog items that appear in multiple places in the Data Catalogue
  - Fixed the layer order changing in Cesium when a CSV variable is chosen.
  - Layer name is now shown in the catalog item info panel for ESRI ArcGIS MapServer layers.
  - Retrieve WFS or WCS URL associated with WMS data sources using DescribeLayer if no dataUrl is present.
  - Sorted ABS age variables numerically, not alphabetically.
  - Fixed a bug that prevented region mapping from working over HTTPS.
  - The proxy is now used to avoid a mixed content warning when accessing an HTTP dataset from an HTTPS deployment of TerriaJS.

### 2015-11-16

- Completely support the [csv-geo-au](https://github.com/NICTA/nationalmap/wiki/csv-geo-au) specification (other than SA1s and boundaries from previous years) including ASGS boundaries like remoteness regions, indigenous areas and non ASGS boundaries like primary health networks.
- Added freight route datasets provided by the Department of Infrastructure and Regional Development under `Transport -> Freight`.
- Added IMOS and AODN Geoservers to the list of hosts that may be proxied.
- Changed the support email address from `nationalmap@communications.gov.au` to `data@pmc.gov.au`.
- Use YouTube videos hosted in the AusGovDPMC account.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.48. Significant changes relevant to NationalMap users include:
  - Update the default Australian topography basemap to Geoscience Australia's new worldwide layer (http://www.ga.gov.au/gisimg/rest/services/topography/National_Map_Colour_Basemap/MapServer)
  - The Feature Info panel now shows all selected features in an accordion control. Previously it only showed the first one.
  - Major refactor of `CsvCatalogItem`, splitting region-mapping functionality out into `RegionProvider` and `RegionProviderList`. Dozens of new test cases. In the process, fixed a number of bugs and added new features including:
    - Regions can be matched using regular expressions, enabling matching of messy fields like local government names ("Baw Baw", "Baw Baw Shire", "Baw Baw (S)", "Shire of Baw Baw" etc).
    - Regions can be matched using a second field for disambiguation (eg, "Campbelltown" + "SA")
    - Drag-and-dropped datasets with a time column behave much better: rather than a fixed time being allocated to each row, each row occupies all the time up until the next row is shown.
    - Enumerated fields are colour coded in lat-long files, consist with region-mapped files.
    - Feedback is now provided after region mapping, showing which regions failed to match, and which matched more than once.
    - Bug: Fields with names starting with 'lon', 'lat' etc were too aggressively matched.
    - Bug: Numeric codes beginning with zeros (eg, certain NT 08xx postcodes) were treated as numbers and failed to match.
    - Bug: Fields with names that could be interpreted as regions weren't available as data variables.
  - The `LocationBarViewModel` now shows the latitude and longitude coordinates of the mouse cursor in 2D as well as 3D.
  - The `LocationBarViewModel` no longer displays a misleading elevation of 0m when in "3D Smooth" mode.
  - Applied markdown to properties shown in the Feature Info Panel.
  - HTML and Markdown text in catalog item metadata, feature information, etc. is now formatted in a more typical way. For example, text inside `<h1>` now looks like a heading. Previously, most HTML styling was stripped out.
  - The `name` of a feature from a CSV file is now taken from a `name` or `title` column, if it exists. Previously the name was always "Site Data".
  - Most catalog items now automatically expose a `dataUrl` that is the same as their `url`.
  - Fixed a bug that caused time-dynamic WMS layers with just one time to not be displayed.
  - Underscores are now replaced with spaces in the feature info panel for `GeoJsonCatalogItem`.
  - Added Proj4 projections to the location bar. Clicking on the bar switches between lats/longs and projected coordinates. To enable this, set `useProjection` to `true`
  - Fixed a bug that caused an exception when running inside an `<iframe>` and the user's browser blocked 3rd-party cookies.
  - Fixed a bug that caused `WebMapServiceCatalogItem` to incorrectly populate the catalog item's metadata with data from GetCapabilities when another layer had a `Title` with the same value as the expected layer's `Name`.
  - Avoid mixed content warnings when using the CartoDB basemaps.
  - Handle WMS time interval specifications (time/time and time/time/periodicity)
  - Allow a single layer of an ArcGIS MapServer to be added through the "Add Data" interface.
  - Updated to [Cesium](http://cesiumjs.org) 1.15. Significant changes relevant to TerriaJS users include:
    - Make KML invalid coordinate processing match Google Earth behavior. [#3124](https://github.com/AnalyticalGraphicsInc/cesium/pull/3124)
    - Fixed issues causing the terrain and sky to disappear when the camera is near the surface. [#2415](https://github.com/AnalyticalGraphicsInc/cesium/issues/2415) and [#2271](https://github.com/AnalyticalGraphicsInc/cesium/issues/2271)
    - Fixed issues causing the terrain and sky to disappear when the camera is near the surface. [#2415](https://github.com/AnalyticalGraphicsInc/cesium/issues/2415) and [#2271](https://github.com/AnalyticalGraphicsInc/cesium/issues/2271)
    - Provided a workaround for Safari 9 where WebGL constants can't be accessed through `WebGLRenderingContext`. Now constants are hard-coded in `WebGLConstants`. [#2989](https://github.com/AnalyticalGraphicsInc/cesium/issues/2989)
    - Added a workaround for Chrome 45, where the first character in a label with a small font size would not appear. [#3011](https://github.com/AnalyticalGraphicsInc/cesium/pull/3011)
    - Fixed an issue with drill picking at low frame rates that would cause a crash. [#3010](https://github.com/AnalyticalGraphicsInc/cesium/pull/3010)

### 2015-10-15

- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.44. Significant changes relevant to NationalMap users include:
  - Fixed a bug that could cause timeseries animation to "jump" when resuming play after it was paused.
  - When catalog items are enabled, the checkbox now animates to indicate that loading is in progress.
  - Add `mode=preview` option in the hash portion of the URL. When present, it is assumed that TerriaJS is being used as a previewer and the "small screen warning" will not be shown.
  - Added the `attribution` property to catalog items. The attribution is displayed on the map when the catalog item is enabled.
  - Fixed a bug that prevented `AbsIttCatalogGroup` from successfully loading its list of catalog items.
  - Allow missing URLs on embedded data (eg. embedded czml data)
  - Fixed a bug loading URLs for ArcGIS services names that start with a number.
- Updated to [Cesium](http://cesiumjs.org) 1.13. Significant changes relevant to NationalMap users include:
  - The default `CTRL + Left Click Drag` mouse behavior is now duplicated for `CTRL + Right Click Drag` for better compatibility with Firefox on Mac OS [#2913](https://github.com/AnalyticalGraphicsInc/cesium/pull/2913).
  - Fixed an issue where non-feature nodes prevented KML documents from loading. [#2945](https://github.com/AnalyticalGraphicsInc/cesium/pull/2945)

### 2015-09-17

- Improved proxy cache expiration. Previously, catalog item tiles could be cached by end-user browsers much longer than intended.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.43. Significant changes relevant to NationalMap users include:
  - Fixed a bug that prevented the opened/closed state of groups from being preserved when sharing.

### 2015-09-03

- Removed "beta" tag
- Added new screenshots and YouTube videos.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.42. Relevant changes include:
  - Fixed a bug sharing CSV items.

### 2015-08-03

- Retired the NICTA-hosted geotopo250k data sets, replacing them with the Geoscience Australia Topography data sets.
- Removed the Topography group under Data Providers.
- Added URL shortening in the share popup, and support launch with shortened URLs.
- Added support for proxying POST requests to the proxy service.
- Populated ACT Government group by querying the ACT Socrata server.
- Added City of Melbourne and Sunshine Coast Council (QLD) to the Data Providers group.
- Added selection of region type (e.g. SA2) for ABS datasets to the Now Viewing tab.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.41. Significant changes relevant to NationalMap users include:
  - `CsvCatalogItem` can now have no display variable selected, in which case all points are the same color.
  - Added `CswCatalogGroup` for populating a catalog by querying an OGC CSW service.
  - Fixed a bug that prevented WMTS layers with a single `TileMatrixSetLink` from working correctly.
  - Added support for WMTS layers that can only provide tiles in JPEG format.
  - Fixed testing and caching of ArcGIS layers from tools and added More information option for imagery layers.
  - Made polygons drastically faster in 2D.
  - Added Google Analytics reporting of the application URL. This is useful for tracking use of share URLs.
  - Added the ability to specify a specific dynamic layer of an ArcGIS Server using just a URL.
  - Fixed a race condition in `AbsIttCatalogItem` that could cause the legend and map to show different state than the Now Viewing UI suggested.
  - Fixed a bug where an ABS concept with a comma in its name (e.g. "South Eastern Europe,nfd(c)" in Country of Birth) would cause values for concept that follow to be misappropriated to the wrong concepts.
  - `ArcGisMapServerCatalogItem` now shows "NoData" tiles by default even after showing the popup message saying that max zoom is exceeded. This can be disabled by setting its `showTilesAfterMessage` property to false.

### 2015-07-19

- Default to 2D on common mobile devices in order to make the app more performant, especially on older mobile devices.
- Significantly improved the experience on devices with small screens, such as phones.
- Start with the Data Catalogue panel hidden on devices with small screens.
- Switched the "Commonwealth Electoral Divisions" dataset to use the official boundaries from the Australia Electoral Commission. Previously it used the Australian Bureau of Statistics versions.
- Additional ABS region support. Now supported internally: AUS,STE,CED,SED,POA,LGA,SA4,SA1,SA2,SA1. Datasets exposing all of these are not yet available.
- The South Australian Government group is now populated by querying the SA CKAN server for GeoJSON and csv-geo-au resources.
- Use `mybroadband:` layers instead of `public:` layers for Broadband datsets.
- Access the Mobile Black Spot Programme datasets via WMS instead of CSV.
- Improved the look and feel of the Help and About pages.
- The elevation value displayed in the lower right corner is now a height above mean sea level (above the EGM96 geoid specifically) instead of a height above the WGS84 ellipsoid.
- Added two new base map options, both from CartoDB: Positron and Dark Matter.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.36. Significant changes relevant to NationalMap users include:
  - Fixed a bug that caused the 3D view to use significant CPU time even when idle.
  - Fixed a bug that caused the popup message to appear twice when a dataset failed to load.
  - Calculate extent of TopoJSON files so that the viewer correctly pans+zooms when a TopoJSON file is loaded.
  - Added ability to filter catalog search results by type: `is:wms`, `is:esri-mapserver`, `is:geojson` and so on.
  - Added layer information to the Info popup for WMS datasets.
  - Polygons from GeoJSON datasets are now filled.
  - Left-aligned feature info table column and added some space between columns.
  - Added support for styling GeoJSON files, either in catalog (add .style{} object) or embedded directly in the file following the [SimpleStyle spec](https://github.com/mapbox/simplestyle-spec).
  - Fixed a bug that prevented catalog items inside groups on the Search tab from being enabled.
  - Added support for discovering GeoJSON datasets from CKAN.
  - Added support for zipped GeoJSON files.
  - Made `KmlCatalogItem` use the proxy when required.
  - Made `FeatureInfoPanelViewModel` use the white panel background in more cases.
  - Fixed a bug that caused only the portion of a CKAN group name before the first comma to be used.
  - Added the `legendUrls` property to allow a catalog item to optionally have multiple legend images.
  - Added a popup message when zooming in to the "No Data" scales of an `ArcGisMapServerCatalogItem`.
  - Added a title text when hovering over the label of an enabled catalog item. The title text informs the user that clicking will zoom to the item.
  - `CatalogItem.zoomTo` can now zoom to much smaller bounding box rectangles.
  - Upgraded to Cesium 1.11.

### 2015-07-03

- Changed the support email address from `nationalmap@lists.nicta.com.au` to `nationalmap@communications.gov.au`.
- Renamed "Gravity Image" to "Gravity Anomaly" and updated it to load from the new server (the old one is deprecated).
- Renamed "Magnetic Image" to "Magnetic Intensity" and updated it to load from the new server (the old one is deprecated).
- Updated the layer name used to access "SRTM 1 sec DEM Image". The old one worked but was not advertised in the WMS server's GetCapabilities, which limited the quality of the metadata.
- The Data.gov.au group now includes CKAN resources with the `csv-geo-au` format.
- Improved the metadata, including descriptions and licence information, for many of the data sets in National Data Sets.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.32. Significant changes relevant to NationalMap users include:
  - Numerous changes to improve the quality of the catalogue item info page.
  - Added support for `csv-geo-*` (e.g. csv-geo-au) to `CkanCatalogGroup`.
  - `CkanCatalogGroup` now fills the `dataUrl` property of created items by pointing to the dataset's page on CKAN.
  - The catalog item information panel now displays `info` sections in a consistent order. The order can be overridden by setting `CatalogItemInfoViewModel.infoSectionOrder`.
  - An empty `description` or `info` section is no longer shown on the catalog item information panel. This can be used to remove sections that would otherwise be populated from dataset metadata.

### 2015-06-24

- Updated the favicon.
- Switched the new Medicare Offices dataset to load directly from data.gov.au.

### 2015-06-23

- Added "Medicare Offices" dataset under Social and Economic.
- Fixed the URL of the Roboto Mono font so that it downloads correctly even over `https`.
- Improved the styling of the About page.
- Fixed an incorrect link to the About page from the disclaimer at the bottom of the map.
- The nm.json file is now created at build time from a number of initialization files in the `datasources` directory. The individual files are easier to manage and edit than a single large file.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.27. Significant changes relevant to NationalMap users include:
  - Fixed incorrect date formatting in the timeline and animation controls on Internet Explorer 9.
  - Added support for CSV files with longitude and latitude columns but no numeric value column. Such datasets are visualized as points with a default color and do not have a legend.
  - The Feature Information popup is now automatically closed when the user changes the `AbsIttCatalogItem` filter.
  - `WebMapServiceCatalogItem` now determines its rectangle from the GetCapabilities metadata even when configured to use multiple WMS layers.
  - `AbsIttCatalogItem` styles can now be set using the `tableStyle` property, much like `CsvCatalogItem`.
  - Improved `AbsIttCatalogItem`'s tolerance of errors from the server.
  - Fixed a bug that caused the brand bar to slide away with the explorer panel on Internet Explorer 9.

### 2015-06-16

- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.23. Significant changes relevant to NationalMap users include:
  - Fixed a bug that prevented features from being pickable from ABS datasets on the 2D map.
  - Fixed a bug that caused the Explorer Panel tabs to be missing or misaligned in Firefox.
  - Changed to use JPEG instead of PNG format for the Natural Earth II basemap. This makes the tile download substantially smaller.

### 2015-06-15

- Added a new Australian Bureau of Statistics group to the catalogue.
- Added all Australian states to the Data Catalogue.
- Replaced the Cesium animation and timeline controller with the new TerriaJS animation and timeline controller.
- National Map now shows its version number when hovering the mouse over the logo on the top left corner.
- Added a longer disclaimer to printed versions of the map.
- Added a Related Maps button and panel. It currently contains links to AREMI and to the Northern Australia map.
- Added a small popup to call attention to the Now Viewing tab the first time a catalog item is enabled.
- Updated to [TerriaJS](https://github.com/TerriaJS/terriajs) 1.0.21. Significant changes relevant to NationalMap users include:
  - Replaced the timeline / animation controller used with time-dynamic datasets. The new one has a cleaner and simpler interface.
  - Added the ability to add an entire ArcGIS Server to the catalogue using the Add Data panel.
  - Improved the capabilities of the hidden Tools panel, accessed by appending `#tools=1` to the URL and clicking the Tools button.
  - Fixed a bug that caused the 2D / 3D buttons the Maps menu to get out of sync with the actual state of the map after switching automatically to 2D due to a performance problem.
  - Added support for connecting to Web Map Tile Service (WMTS) servers.

### 2015-05-28

- To hide the Explorer Panel at startup, the url can contain the parameter `hideEplorerPanel=1`.
- Upgraded to [TerriaJS 1.0.15](https://github.com/TerriaJS/terriajs/blob/1.0.15/CHANGES.md). Significant changes relevant to National Map users include:
  - Esri ArcGIS MapServers can now be added via the "Add Data" panel.
  - We now support discovery of ArcGIS MapServer "Raster Layers" in addition to "Feature Layers".
  - Sharing now preserves the base map and view mode (2D/3D) selection.
  - Improved error handling in `CzmlCatalogItem`, `GeoJsonCatalogItem`, and `KmlCatalogItem`.
  - We now raise an error and hide the dataset when asked to show a layer in Leaflet and that layer does not use the Web Mercator (EPSG:3857) projection. Previously, the dataset would silently fail to display.
  - Fixed a bug that caused Internet Explorer 8 users to see a blank page instead of a message saying their browser is incompatible.

### 2015-05-15

- Dataset changes:
  - Added New South Wales Government
  - Added National Data Sets -> Surface Water -> Water Observations from Space
  - Added National Data Sets -> Social and Economic -> Housing Stress
  - Data Providers -> Water (Bureau of Meteorology Geofabric) now has sensible groups instead of a flat list.
- National Map is now built on [TerriaJS](http://www.github.com/TerriaJS/terriajs). See the [changelog](https://github.com/TerriaJS/terriajs/blob/1.0.11/CHANGES.md) for the complete list of changes since TerriaJS split off from National Map. Significant changes relevant to National Map users include:
  - The Search tab now searches the names of all datasets in the catalogue, including those in delay-loaded groups.
  - The 2D view once again correctly shows imagery attribution.
  - The catalog item info page now renders a much more complete set of Markdown and HTML elements.
  - Added support for region mapping based on region names instead of region numbers (example in `wwwroot/test/countries.csv`).
  - Added support for time-dynamic region mapping (example in `wwwroot/test/droughts.csv`).
  - Added the ability to region-map countries (example in `wwwroot/test/countries.csv`).
  - Esri ArcGIS MapServer datasets now show much more information when the user clicks the Info button.
  - Improved the appearance of the legends generating with region mapping.
  - Fixed a bug that caused features to be picked from all layers in an Esri MapServer, instead of just the visible ones.
  - Added support for the WMS MinScaleDenominator property and the Esri MapServer maxScale property, preventing layers using these properties from disappearing when zoomed in to close to the surface.
  - Fixed a bug that could cause the "Drop a data file anywhere" message to get stuck on when dragging a file over the application while a modal dialog was open.
  - Elminated distracting "jumping" of the selection indicator when picking point features while zoomed in very close to the surface.
  - The 3D viewer now shows Bing Maps imagery unmodified, matching the 2D viewer. Previously, it applied a gamma correction.
  - Polygons loaded from KML files are now placed on the terrain surface.
  - We no longer automatically fly to the first location when pressing Enter in the Search input box, because this was surprising and often didn't work well.
  - Checkboxes in the Data Catalogue and Search tabs now have a larger clickable area, which is especially helpful on touch screens.
  - The Feature Information functionality now works with servers that can only return HTML, and displays it appropriately. This is especially useful for Google Maps Engine (GME) WMS servers.
- The Bing Maps API key can now be specified in config.json.

### 2015-04-15

- Upgraded to Cesium 1.8. See the [changelog](https://github.com/AnalyticalGraphicsInc/cesium/blob/1.8/CHANGES.md) for details.
- Added support for time-dynamic WMS layers by specifying the `intervals` property. If not specified explicitly, times are also automatically deduced from `GetCapabilities`.
- Improved the consistency and functionality of the feature information popup.
- Improved the selection indicator when selecting features by clicking them on the map.
- Made numerous improvements to the server performance check tool, accessed by appending `#tools=1` to the URL and clicking the Tools button.
- Added `preserveOrder` property to catalogue groups. When set, the group's items will not be sorted by name.
- Added `titleField` property to WMS catalogue items to specify whether the WMS layer's title (default), name, or abstract is displayed in the catalogue.
- Clicking the clear (x) button on the search panel now returns focus to the search box.
- The Maps panel no longer prevents attempts to interact with the map.
- Very long labels in the Data Catalogue and Now Viewing tabs are now handled more gracefully.
- The input box on the Search tab no longer scrolls along with the search results.
- Added `ignoreUnknownTileErrors` property to `WebMapServiceCatalogItem` to facilitate working with badly-behaved WMS servers.
- Added `itemProperties` property to `WebMapServiceCatalogGroup` to specify additional properties to apply to the catalog items created by querying `GetCapabilities`.
- Fixed a bug that prevented WFS datasets from working in Internet Explorer 10 and Safari.

### 2015-03-26

- Greatly enhanced support for ArcGIS servers. ArcGIS map servers can now be queried for their list of layers to populate the Data Catalogue, and they can provide metadata information when clicking a feature on the map.
- Added features to the Tools panel (accessible by visiting http://nationalmap.nicta.com.au/#tools=1) to test datasets.
- Added the "Broadband ADSL Availability" and "Broadband ADSL Availability no Borders" datasets to the catalogue under Communications. Also fixed a typo in the name of "Broadband Availability no Borders".
- Improved styling of feature information popup in 2D viewer.
- Fixed a bug that prevented KMZ files from loading.
- Pressing Reset View now zooms back to see all of Australia even when the application is launched with a share link with another view.
- Fixed a bug that caused the view to be tilted slightly away from North after clicking the Reset View button.
- Made the 2D and 3D viewers use the exact same tile URLs, to improve caching.
- Many styling improvements / refinements.
- Fixed a bug that could cause very high memory usage when accessing a WMS server with very long strings in its metadata.
- Made National Map work even when it is not hosted at the root of the web server.

### 2015-03-03

- Add a prototype of loading KML files from data.gov.au, accessible at http://nationalmap.nicta.com.au/#dgakml.
- Improve the accuracy of picking features from WMS layers in the 3D view.
- Support picking of vector features (from GeoJSON, KML, CZML, etc.) in the 2D view even when a raster dataset (WMS, etc.) is also visible.
- Fix a bug that prevented most of the base maps from working in the 2D view.
- Fix a bug that sometimes caused high CPU usage in the 3D view.
- Dataset descriptions may now include embedded images using Markdown syntax.
- Ensure the 3D globe repaints when finished loading datasets from some sources, such GeoJSON, CZML, and WFS.
- Add support for displaying feature information from WFS and WMS servers that support GML but not GeoJSON.
- Fix a bug preventing vector polygons from GeoJSON, CZML, etc. from appearing in the 2D view.
- Fix a bug that prevented time-varying polylines from updating in the 2D view after they were initially displayed.

### 2015-02-17

#### New features, major improvements, and Catalogue changes:

- Promote data.gov.au to a top-level group and organize its datasets by Organization.
- Add the new GA topographic basemap as an option to the Maps panel.
- Add Tasmanian Government as a top-level group.
- Add a Tools panel, accessible from the menu bar when visiting http://nationalmap.nicta.com.au/#tools=1. These tools aren't intended for use by end users.
- Fix the Population Estimates dataset. We were pointing to a server that had been retired.
- Hide the following datasets in the "Water (Bureau of Meteorology Geofabric)" group due to poor performance: Groundwater Cartography 2.1, Surface Cartography, Surface Network 2.1.
- Add Mobile Black Spot dataset.

#### Bug fixes:

- Fix a bug where Cesium would sometimes not update when zooming in using two-finger scrolling on a touchpad.
- Fix a bug where Cesium would sometimes not update when using animation/timeline controls.
- Fix a hang when shift-drag zooming and releasing shift before releasing the mouse button.
- Fix a bug that prevented CSVs from being added to the map by URL. Drag/drop and file selection worked fine.
- Make a region-mapped CSVs file a reorderable layer in the Now Viewing panel.
- Fix a bug that caused region-mapped layers to disappear when switching from 3D to 2D.

#### Minor changes / tweaks:

- Improve performance of the Broadband layers by leveraging the GeoWebCache and avoiding requests for non-cacheable tiles outside the region covered by the data.
- Remove the drop shadow around the compass to match the flat appearance of the rest of the UI.
- Make logos in the top-left ("brand bar") clickable.
- Re-add placeholder text ("Search address, landmark, or data set") to the Search tab input box.
- Make previously invalid URLs like http://nationalmap.nicta.com.au/#vic/ work
- Improve performance (especially in Safari) by only updating the distance / scale legend once every 250ms rather than continuously.
- Automatically switch to 2D, without losing any data, in the event of an unexpected error during 3D rendering.
- If not specified in the catalogue file, the spatial extent of a WMS layer is now automatically determined from the server's GetCapabilities.
- Update to Cesium 1.6 (changelog: https://github.com/AnalyticalGraphicsInc/cesium/blob/1.6/CHANGES.md )
- Access data.gov.au and ga.gov.au via the caching proxy for better performance.
- Improve the computation of the visible extent in 3D view, making the view stay more consistent when switching between 2D and 3D view.
- Improve the accuracy of the shared 3D view by adding precise camera parameters to the URL.
- Improve the performance of rendering point features, especially in 2D.
