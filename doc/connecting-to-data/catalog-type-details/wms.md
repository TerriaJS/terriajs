
Creates a single item in the catalog from one or many WMS layers. <br/> 
 <strong> Note: </strong>   <i> To present all layers in an available WMS as individual items in the catalog use the  ` WebMapServiceCatalogGroup `. </i>


## Example usage
````json
{
  "type": "wms",
  "name": "Mangrove Cover",
  "url": "https://ows.services.dea.ga.gov.au",
  "layers": "mangrove_cover_v2_0_2"
}
````


## Properties

"type": "wms"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| availableDiffStyles | **string[]** |  | List of styles that can be used for computing difference image |
| isShowingDiff | **boolean** | false | True if currently showing diff image |
| firstDiffDate | **string** |  | The first date to use to compute the difference image |
| secondDiffDate | **string** |  | The second date to use to compute the difference image |
| diffStyleId | **string** |  | The ID of the style used to compute the difference image |
| featureInfoTemplate | **object** <br> see below | | A template object for formatting content in feature info panel |
| featureInfoUrlTemplate | **string** |  | A template URL string for fetching feature info. Template values of the form {x} will be replaced with corresponding property values from the picked feature. |
| showStringIfPropertyValueIsNull | **string** |  | If the value of a property is null or undefined, show the specified string as the value of the property. Otherwise, the property name will not be listed at all. |
| keepOnTop | **boolean** | false | Keeps the layer on top of all other imagery layers. |
| splitDirection | **number** | 0 | The side of the splitter to display this imagery layer on. Defaults to both sides. |
| name | **string** |  | The name of the catalog item. |
| description | **string** |  | The description of the catalog item. Markdown and HTML may be used. |
| nameInCatalog | **string** |  | The name of the item to be displayed in the catalog, if it is different from the one to display in the workbench. |
| info | **object[]** <br> see below | | Human-readable information about this dataset. |
| infoSectionOrder | **string[]** | ,,,,,,,,,,,, | An array of section titles definining the display order of info sections. If this property is not defined, {@link DataPreviewSections}'s DEFAULT_SECTION_ORDER is used |
| isOpenInWorkbench | **boolean** | true | Whether the item in the workbench open or collapsed. |
| shortReport | **string** |  | A short report to show on the now viewing tab. |
| shortReportSections | **object[]** <br> see below | | A list of collapsible sections of the short report |
| isExperiencingIssues | **boolean** | false | Whether the catalog item is experiencing issues which may cause its data to be unavailable |
| hideLegendInWorkbench | **boolean** | false | Whether the legend is hidden in the workbench for this catalog member. |
| hideSource | **boolean** | false | Indicates that the source of this data should be hidden from the UI (obviously this isn't super-secure as you can just look at the network requests). |
| currentTime | **string** |  | The current time at which to show this dataset. |
| initialTimeSource | **string** | now | The initial time to use if `Current Time` is not specified. Valid values are <br/> * `start` - the dataset's start time <br/> * `stop` - the dataset's stop time <br/> * `now` - the current system time. If the system time is after `Stop Time`, `Stop Time` is used. If the system time is before `Start Time`, `Start Time` is used. <br/> * `none` - do not automatically set an initial time <br/> This value is ignored if `Current Time` is specified. |
| startTime | **string** |  | The earliest time for which this dataset is available. This will be the start of the range shown on the timeline control. |
| stopTime | **string** |  | The latest time for which this dataset is available. This will be the end of the range shown on the timeline control. |
| multiplier | **number** |  | The multiplier to use in progressing time for this dataset. For example, `5.0` means that five seconds of dataset time will pass for each one second of real time. |
| isPaused | **boolean** | true | True if time is currently paused for this dataset, or false if it is progressing. |
| dateFormat | **string** |  | A dateformat string (using the dateformat package) used to adjust the presentation of the date in various spots in the UI for a catalog item. <br/>For example, to just show the year set to 'yyyy'. Used in places like the the Workbench Item and Bottom Dock |
| show | **boolean** | true | Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel. |
| fromContinuous | **string** | nearest | Specifies how a continuous time (e.g. the timeline control) is mapped to a discrete time for this dataset. Valid values are: <br/> * `nearest` - the nearest available discrete time to the current continuous time is used. <br/> * `next` - the discrete time equal to or after the current continuous time is used. <br/> * `previous` - the discrete time equal to or before the current continuous time is used. |
| showInChartPanel | **boolean** | false | Whether to plot data availability on a chart. |
| chartType | **string** | momentLines | Type determines how the data availibility will be plotted on chart. eg: momentLines, momentPoints |
| chartDisclaimer | **string** |  | A HTML string to show above the chart as a disclaimer |
| disableDateTimeSelector | **boolean** | false | When true, disables the date time selector in the workbench |
| timeFilterPropertyName | **string** |  | The name of a property in a feature returned from this layer's feature query service that indicates the times at which this layer covers this position. For example, historical and near-real-time satellite imagery often comes as daily swaths, with a given area on the globe potentially only covered every number of days. |
| timeFilterCoordinates | **object** <br> see below | | The current position picked by the user for filtering |
| getCapabilitiesUrl | **string** |  | The URL at which to access to the OGC GetCapabilities service. |
| getCapabilitiesCacheDuration | **string** | 1d | The amount of time to cache GetCapabilities responses. |
| opacity | **number** | 0.8 | The opacity of the map layers. |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** | 0d | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
| rectangle | **object** <br> see below | | The bounding box rectangle that contains all the data in this catalog item. |
| disablePreview | **boolean** | false | Disables the preview on the Add Data panel. This is useful when the preview will be very slow to load. |
| refreshInterval | **number** |  | How often the data in this model is refreshed, in seconds |
| refreshEnabled | **boolean** |  | Toggle for enabling auto refresh. |
| isGeoServer | **string** | false | True if this WMS is a GeoServer; otherwise, false. |
| layers | **string** |  | The layer or layers to display. |
| styles | **string** |  | The styles to use with each of the `Layer(s)`. |
| availableStyles | **object[]** <br> see below | | The available styles. |
| legends | **object[]** <br> see below | | The legends to display on the workbench. |
| parameters | **** |  | Additional parameters to pass to the MapServer when requesting images. |
| minScaleDenominator | **number** |  | The denominator of the largest scale (smallest denominator) for which tiles should be requested. For example, if this value is 1000, then tiles representing a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property, will be used and will simply get blurier as the user zooms in closer. |
| hideLayerAfterMinScaleDenominator | **boolean** | false | True to hide tiles when the `Minimum Scale Denominator` is exceeded. If false, we can zoom in arbitrarily close to the (increasingly blurry) layer. |
| maxRefreshIntervals | **number** | 1000 | The maximum number of discrete times that can be created by a single date range, when specified in the format time/time/periodicity. E.g. `2015-04-27T16:15:00/2015-04-27T18:45:00/PT15M` has 11 times. |
| disableStyleSelector | **boolean** | false | When true, disables the style selector in the workbench |
| linkedWcsUrl | **string** |  | Gets or sets the URL of a WCS that enables clip-and-ship for this WMS item. |
| linkedWcsCoverage | **string** |  | Gets or sets the coverage name for linked WCS for clip-and-ship. |
 

### Feature info template
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | A mustache template string for formatting name |
| template | **string** |  | A Mustache template string for formatting description |
| partials | **** |  | An object, mapping partial names to a template string. Defines the partials used in Template. |

### Info
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | The name of the section. |
| content | **string** |  | The content of the section, in Markdown and HTML format. Set this property to null to remove this section entirely. |

### Short report sections
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | The name of the section. |
| content | **string** |  | The content of the section. |
| show | **boolean** |  | Indicates if this short report section showing. |

### Time filter coordinates
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| latitude | **number** |  | Latitude in degrees |
| longitude | **number** |  | Longitude in degrees |
| height | **number** |  | Height above ellipsoid in metres |
| tile | **object** | [object Object] | x, y, level coordinates of the picked tile. Refer: https://cesium.com/docs/cesiumjs-ref-doc/ImageryProvider.html?classFilter=imageryprovider#pickFeatures |
| x | **number** |  | X coordinate of the tile |
| y | **number** |  | Y coordinate of the tile |
| level | **number** |  | Zoom level of the tile |

### Rectangle
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| west | **number** |  | The westernmost longitude in degrees. |
| south | **number** |  | The southernmost longitude in degrees. |
| east | **number** |  | The easternmost longitude in degrees. |
| north | **number** |  | The northernmost longitude in degrees. |

### Available Styles
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| layerName | **string** |  | The name of the layer for which styles are available. |
| styles | **object[]** |  | The styles available for this layer. |
| name | **string** |  | The name of the style. |
| title | **string** |  | The title of the style. |
| abstract | **string** |  | The abstract describing the style. |
| legend | **object** |  | The name of the style. |
| title | **string** |  | A title to be displayed above the legend. |
| url | **string** |  | The URL of the legend image. |
| urlMimeType | **string** |  | The MIME type of the `URL` legend image. |
| items | **object[]** |  |  |
| title | **string** |  | The title to display next to this legend item. |
| titleAbove | **string** |  | The title to display above this legend item, i.e. marking the top of a box on the legend. |
| titleBelow | **string** |  | The title to display below this legend item, i.e. marking the bottom of a box on the legend. |
| color | **string** |  | The CSS color to display for this item. This property is ignored if `Legend URL` is specified. |
| outlineColor | **string** |  | The CSS color with which to outline this item. |
| multipleColors | **string[]** |  | Multiple colors to show with this item in a grid arrangement. |
| imageUrl | **string** |  | The URL of an image to display with this item. |
| addSpacingAbove | **boolean** |  | True to add a bit of extra spacing above this item in order to separate it visually from the rest of the legend. |
| imageHeight | **number** |  | The height of the legend image. |
| imageWidth | **number** |  | The width of the legend image. |

### Legend URLs
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| title | **string** |  | A title to be displayed above the legend. |
| url | **string** |  | The URL of the legend image. |
| urlMimeType | **string** |  | The MIME type of the `URL` legend image. |
| items | **object[]** |  |  |
| title | **string** |  | The title to display next to this legend item. |
| titleAbove | **string** |  | The title to display above this legend item, i.e. marking the top of a box on the legend. |
| titleBelow | **string** |  | The title to display below this legend item, i.e. marking the bottom of a box on the legend. |
| color | **string** |  | The CSS color to display for this item. This property is ignored if `Legend URL` is specified. |
| outlineColor | **string** |  | The CSS color with which to outline this item. |
| multipleColors | **string[]** |  | Multiple colors to show with this item in a grid arrangement. |
| imageUrl | **string** |  | The URL of an image to display with this item. |
| addSpacingAbove | **boolean** |  | True to add a bit of extra spacing above this item in order to separate it visually from the rest of the legend. |
| imageHeight | **number** |  | The height of the legend image. |
| imageWidth | **number** |  | The width of the legend image. |
