


## Properties

"type": "sos"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| featureInfoTemplate | **object** <br> see below | | A template object for formatting content in feature info panel |
| featureInfoUrlTemplate | **string** |  | A template URL string for fetching feature info. Template values of the form {x} will be replaced with corresponding property values from the picked feature. |
| showStringIfPropertyValueIsNull | **string** |  | If the value of a property is null or undefined, show the specified string as the value of the property. Otherwise, the property name will not be listed at all. |
| keepOnTop | **boolean** | false | Keeps the layer on top of all other imagery layers. |
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
| initialTimeSource | **string** | start | The initial time to use if `Current Time` is not specified. Valid values are <br/> * `start` - the dataset's start time <br/> * `stop` - the dataset's stop time <br/> * `now` - the current system time. If the system time is after `Stop Time`, `Stop Time` is used. If the system time is before `Start Time`, `Start Time` is used. <br/> * `none` - do not automatically set an initial time <br/> This value is ignored if `Current Time` is specified. |
| startTime | **string** |  | The earliest time for which this dataset is available. This will be the start of the range shown on the timeline control. |
| stopTime | **string** |  | The latest time for which this dataset is available. This will be the end of the range shown on the timeline control. |
| multiplier | **number** |  | The multiplier to use in progressing time for this dataset. For example, `5.0` means that five seconds of dataset time will pass for each one second of real time. |
| isPaused | **boolean** | true | True if time is currently paused for this dataset, or false if it is progressing. |
| dateFormat | **string** |  | A dateformat string (using the dateformat package) used to adjust the presentation of the date in various spots in the UI for a catalog item. <br/>For example, to just show the year set to 'yyyy'. Used in places like the the Workbench Item and Bottom Dock |
| show | **boolean** | true | Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel. |
| rectangle | **object** <br> see below | | The bounding box rectangle that contains all the data in this catalog item. |
| disablePreview | **boolean** | false | Disables the preview on the Add Data panel. This is useful when the preview will be very slow to load. |
| opacity | **number** | 0.8 | The opacity of the map layers. |
| showUnmatchedRegionsWarning | **boolean** | true | True to show a warning when some of the region IDs in the CSV file could not be matched to a region. False to silently ignore unmatched regions. |
| columns | **object[]** <br> see below | | Options for individual columns in the CSV. |
| defaultColumn | **object** <br> see below | | The default settings to use for all columns |
| styles | **object[]** <br> see below | | The set of styles that can be used to visualize this dataset. |
| defaultStyle | **object** <br> see below | | The default style to apply when visualizing any column in this CSV. |
| activeStyle | **string** |  | The ID of the currently-selected style. |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** | 0d | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
| requestSizeLimit | **number** | 200 | Gets or sets the maximum number of timeseries to request of the server in a single GetObservation request. Servers may have a Response Size Limit, eg. 250. Note the number of responses may be different to the number requested, eg. the BoM server can return > 1 timeseries/feature identifier, (such as ...stations/41001702), so it can be sensible to set this below the response size limit. |
| requestNumberLimit | **number** | 3 | Gets or sets the maximum number of GetObservation requests that we can fire off at a time. If the response size limit is 250, and this is 4, then observations for at most 1000 features will load. If there are more than 1000 features, they will be shown without observation data, until they are clicked. |
| requestTemplate | **string** |  | The template XML string to POST to the SOS server to query for GetObservation. If this property is undefined, `SensorObservationServiceCatalogItem.defaultRequestTemplate` is used. This is used as a Mustache template. See SensorObservationServiceRequestTemplate.xml for the default. Be careful with newlines inside tags: Mustache can add an extra space in the front of them, which causes the request to fail on the SOS server. |
| observableProperties | **object[]** <br> see below | | The sensor observation service observableProperties that the user can choose from for this catalog item. |
| filterByProcedures | **boolean** | true | Whether to include the list of procedures in GetFeatureOfInterest calls, so that only locations that support those procedures are returned. For some servers (such as BoM's Water Data Online), this causes the request to time out. |
| procedures | **object[]** <br> see below | | The sensor observation service procedures that the user can choose from for this catalog item. |
| proceduresName | **string** |  | Gets or sets the name seen by the user for the list of procedures. Defaults to `Procedure`, but eg. for BoM, `Frequency` would be better. |
| observablePropertiesName | **string** |  | Gets or sets the name seen by the user for the list of observable properties. Defaults to `Property`, but eg. for BoM, `Observation type` would be better. |
| stationIdWhitelist | **string[]** |  | If set, an array of IDs. Only station IDs that match these will be included. |
| stationIdBlacklist | **string[]** |  | If set, an array of IDs. Only station IDs that match these will be included. |
| startDate | **string** |  | An start date in ISO8601 format. All requests filter to this start date. Set to undefined for no temporal filter. |
| endDate | **string** |  | An end date in ISO8601 format. All requests filter to this end date. Set to undefined to use the current date. |
| showAsChart | **boolean** | false | When `true`, loads the observation data for charts instead of feature points data to plot on map |
| chartFeatureOfInterestIdentifier | **string** |  | The `identifier` of the feature-of-interest for which we are showing the chart. |
| selectedObservableId | **string** |  | The identifier of the selected observable property |
 

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

### Rectangle
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| west | **number** |  | The westernmost longitude in degrees. |
| south | **number** |  | The southernmost longitude in degrees. |
| east | **number** |  | The easternmost longitude in degrees. |
| north | **number** |  | The northernmost longitude in degrees. |

### Columns
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | The name of the column. |
| title | **string** |  | The displayed title of the column. |
| units | **string** |  | The units for the column values. |
| type | **string** |  | The type of the column. If not specified, the type is guessed from the column's name and values. Valid types are:* `0`* `1`* `2`* `3`* `4`* `5`* `6`* `7`* `8`* `9`* `longitude`* `latitude`* `height`* `time`* `scalar`* `enum`* `region`* `text`* `address`* `hidden` |
| regionType | **string** |  | The type of region referenced by the values in this column. If `Type` is not defined and this value can be resolved, the column `Type` will be `region`. |
| regionDisambiguationColumn | **string** |  | The name of the column to use to disambiguate region matches in this column. |
| replaceWithZeroValues | **string[]** |  | Values of the column to replace with 0.0, such as `-`. |
| replaceWithNullValues | **string[]** |  | Values of the column to replace with null, such as `NA`. |
| format | **** |  | The formatting options to pass to `toLocaleString` when formatting the values of this column for the legend and feature information panels. See:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString |

### Default Column
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | The name of the column. |
| title | **string** |  | The displayed title of the column. |
| units | **string** |  | The units for the column values. |
| type | **string** |  | The type of the column. If not specified, the type is guessed from the column's name and values. Valid types are:* `0`* `1`* `2`* `3`* `4`* `5`* `6`* `7`* `8`* `9`* `longitude`* `latitude`* `height`* `time`* `scalar`* `enum`* `region`* `text`* `address`* `hidden` |
| regionType | **string** |  | The type of region referenced by the values in this column. If `Type` is not defined and this value can be resolved, the column `Type` will be `region`. |
| regionDisambiguationColumn | **string** |  | The name of the column to use to disambiguate region matches in this column. |
| replaceWithZeroValues | **string[]** |  | Values of the column to replace with 0.0, such as `-`. |
| replaceWithNullValues | **string[]** |  | Values of the column to replace with null, such as `NA`. |
| format | **** |  | The formatting options to pass to `toLocaleString` when formatting the values of this column for the legend and feature information panels. See:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString |

### Styles
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| id | **string** |  | The ID of the style. |
| title | **string** |  | The human-readable title of the style. Set this to null to remove the style entirely. |
| legendTitle | **string** |  | The title to show on the legend. If not specified, `Title` is used. |
| regionColumn | **string** |  | The column to use for region mapping. |
| latitudeColumn | **string** |  | The column to use for the latitude of points. If `Region Column` is specified, this property is ignored. |
| longitudeColumn | **string** |  | The column to use for the longitude of points. If `Region Column` is specified, this property is ignored. |
| color | **object** |  | Options for controlling the color of points or regions. |
| colorColumn | **string** |  | The column to use to color points or regions. |
| nullColor | **string** |  | The color to use when the value is null, specified as a CSS color string. |
| regionColor | **string** |  | The color to use when the styling the region, specified as a CSS color string. |
| nullLabel | **string** |  | The label to use in the legend for null values. |
| binMethod | **string** |  | The method for quantizing color. For numeric columns, valid values are:* `auto` (default)* `ckmeans`* `quantile`* `none` (equivalent to `Number of Bins`=0)For enumerated columns, valid values are:* `auto` (default)* `top`* `cycle` |
| numberOfBins | **number** |  | The number of different colors to bin the data into. This property is ignored if `Bin Maximums` is specified for a `scalar` column or `Enum Colors` is specified for an `enum` column. |
| binMaximums | **number[]** |  | The maximum values of the bins to bin the data into, specified as an array of numbers. The first bin extends from the dataset's minimum value to the first value in this array. The second bin extends from the first value in this array to the second value in this array. And so on. If the maximum value of the dataset is greater than the last value in this array, an additional bin is added automatically. This property is ignored if the `Color Column` is not a scalar. |
| binColors | **string[]** |  | The colors to use for the bins, each specified as a CSS color string. If there are more colors than bins, the extra colors are ignored. If there are more bins than colors, the colors are repeated as necessary. |
| enumColors | **object[]** |  | The colors to use for enumerated values. This property is ignored if the `Color Column` type is not `enum`. |
| value | **string** |  | The enumerated value to map to a color. |
| color | **string** |  | The CSS color to use for the enumerated value. |
| colorPalette | **string** |  | The name of a [ColorBrewer](http://colorbrewer2.org/) palette to use when mapping values to colors. This property is ignored if `Bin Colors` is defined and has enough colors for all bins, or if `Enum Colors` is defined. The default value depends on the type of the `Color Column` and on the data. Scalar columns that cross zero will use the diverging purple-to-orange palette `PuOr`. Scala columns that do not cross zero will use the sequential yellow-orange-red palette `YlOrRd`. All other scenarios will use the 21 color `HighContrast` palette. |
| legendTicks | **number** |  | The number of tick marks (in addition to the top and bottom) to show on the legend when the `Color Bin Method` is set to `none` and `Color Bins` is not defined. |
| legend | **object** |  | The legend to show with this style. If not specified, a suitable is created automatically from the other parameters. |
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
| pointSize | **object** |  | Options for controlling the size of points. This property is ignored for regions. |
| pointSizeColumn | **string** |  | The column to use to size points. |
| nullSize | **number** |  | The point size, in pixels, to use when the column has no value. |
| sizeFactor | **number** |  | The size, in pixels, of the point is:`Normalized Value * Size Factor + Size Offset`where the Normalized Value is a value in the range 0 to 1 with 0 representing the lowest value in the column and 1 representing the highest. |
| sizeOffset | **number** |  | The size, in pixels, of the point is:`Normalized Value * Size Factor + Size Offset`where the Normalized Value is a value in the range 0 to 1 with 0 representing the lowest value in the column and 1 representing the highest. |
| chart | **object** |  | Options for controlling the chart created from this CSV. |
| xAxisColumn | **string** |  | The column to use as the X-axis. |
| lines | **object[]** |  | Lines on the chart, each of which is formed by plotting a column as the Y-axis. |
| yAxisColumn | **string** |  | The column to use as the Y-axis. |
| yAxisMinimum | **string** |  | The minimum value to show on the Y axis of the chart. |
| yAxisMaximum | **string** |  | The maximum value to show on the Y axis of the chart. |
| color | **string** |  | The color of the line. If not specified, a unique color will be assigned automatically. |
| isSelectedInWorkbench | **boolean** |  | The selection state of the line in the workbench. |
| time | **object** |  | Options for controlling how the visualization changes with time. |
| timeColumn | **string** |  | The column that indicates the time of a sample or the start time of an interval. |
| endTimeColumn | **string** |  | The column that indicates the end time of an interval. |
| idColumns | **string** |  | The columns that identify an entity as it changes over time. |
| isSampled | **boolean** |  | True if the rows in this CSV correspond to "sampled" data, and so the feature position, color, and size should be interpolated to produce smooth animation of the features over time. If False, then times are treated as the start of discrete periods and feature positions, colors, and sizes are kept constant until the next time. This value is ignored if the CSV does not have both a time column and an ID column. |
| displayDuration | **number** |  | Display duration for each row in the table, in minutes. |

### Default Style
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| id | **string** |  | The ID of the style. |
| title | **string** |  | The human-readable title of the style. Set this to null to remove the style entirely. |
| legendTitle | **string** |  | The title to show on the legend. If not specified, `Title` is used. |
| regionColumn | **string** |  | The column to use for region mapping. |
| latitudeColumn | **string** |  | The column to use for the latitude of points. If `Region Column` is specified, this property is ignored. |
| longitudeColumn | **string** |  | The column to use for the longitude of points. If `Region Column` is specified, this property is ignored. |
| color | **object** | [object Object] | Options for controlling the color of points or regions. |
| colorColumn | **string** |  | The column to use to color points or regions. |
| nullColor | **string** |  | The color to use when the value is null, specified as a CSS color string. |
| regionColor | **string** |  | The color to use when the styling the region, specified as a CSS color string. |
| nullLabel | **string** |  | The label to use in the legend for null values. |
| binMethod | **string** |  | The method for quantizing color. For numeric columns, valid values are:* `auto` (default)* `ckmeans`* `quantile`* `none` (equivalent to `Number of Bins`=0)For enumerated columns, valid values are:* `auto` (default)* `top`* `cycle` |
| numberOfBins | **number** |  | The number of different colors to bin the data into. This property is ignored if `Bin Maximums` is specified for a `scalar` column or `Enum Colors` is specified for an `enum` column. |
| binMaximums | **number[]** |  | The maximum values of the bins to bin the data into, specified as an array of numbers. The first bin extends from the dataset's minimum value to the first value in this array. The second bin extends from the first value in this array to the second value in this array. And so on. If the maximum value of the dataset is greater than the last value in this array, an additional bin is added automatically. This property is ignored if the `Color Column` is not a scalar. |
| binColors | **string[]** |  | The colors to use for the bins, each specified as a CSS color string. If there are more colors than bins, the extra colors are ignored. If there are more bins than colors, the colors are repeated as necessary. |
| enumColors | **object[]** |  | The colors to use for enumerated values. This property is ignored if the `Color Column` type is not `enum`. |
| value | **string** |  | The enumerated value to map to a color. |
| color | **string** | [object Object] | The CSS color to use for the enumerated value. |
| colorPalette | **string** |  | The name of a [ColorBrewer](http://colorbrewer2.org/) palette to use when mapping values to colors. This property is ignored if `Bin Colors` is defined and has enough colors for all bins, or if `Enum Colors` is defined. The default value depends on the type of the `Color Column` and on the data. Scalar columns that cross zero will use the diverging purple-to-orange palette `PuOr`. Scala columns that do not cross zero will use the sequential yellow-orange-red palette `YlOrRd`. All other scenarios will use the 21 color `HighContrast` palette. |
| legendTicks | **number** |  | The number of tick marks (in addition to the top and bottom) to show on the legend when the `Color Bin Method` is set to `none` and `Color Bins` is not defined. |
| legend | **object** |  | The legend to show with this style. If not specified, a suitable is created automatically from the other parameters. |
| title | **string** |  | A title to be displayed above the legend. |
| url | **string** |  | The URL of the legend image. |
| urlMimeType | **string** |  | The MIME type of the `URL` legend image. |
| items | **object[]** |  |  |
| title | **string** |  | The title to display next to this legend item. |
| titleAbove | **string** |  | The title to display above this legend item, i.e. marking the top of a box on the legend. |
| titleBelow | **string** |  | The title to display below this legend item, i.e. marking the bottom of a box on the legend. |
| color | **string** | [object Object] | The CSS color to display for this item. This property is ignored if `Legend URL` is specified. |
| outlineColor | **string** |  | The CSS color with which to outline this item. |
| multipleColors | **string[]** |  | Multiple colors to show with this item in a grid arrangement. |
| imageUrl | **string** |  | The URL of an image to display with this item. |
| addSpacingAbove | **boolean** |  | True to add a bit of extra spacing above this item in order to separate it visually from the rest of the legend. |
| imageHeight | **number** |  | The height of the legend image. |
| imageWidth | **number** |  | The width of the legend image. |
| pointSize | **object** | [object Object] | Options for controlling the size of points. This property is ignored for regions. |
| pointSizeColumn | **string** |  | The column to use to size points. |
| nullSize | **number** |  | The point size, in pixels, to use when the column has no value. |
| sizeFactor | **number** |  | The size, in pixels, of the point is:`Normalized Value * Size Factor + Size Offset`where the Normalized Value is a value in the range 0 to 1 with 0 representing the lowest value in the column and 1 representing the highest. |
| sizeOffset | **number** |  | The size, in pixels, of the point is:`Normalized Value * Size Factor + Size Offset`where the Normalized Value is a value in the range 0 to 1 with 0 representing the lowest value in the column and 1 representing the highest. |
| chart | **object** | [object Object] | Options for controlling the chart created from this CSV. |
| xAxisColumn | **string** |  | The column to use as the X-axis. |
| lines | **object[]** |  | Lines on the chart, each of which is formed by plotting a column as the Y-axis. |
| yAxisColumn | **string** |  | The column to use as the Y-axis. |
| yAxisMinimum | **string** |  | The minimum value to show on the Y axis of the chart. |
| yAxisMaximum | **string** |  | The maximum value to show on the Y axis of the chart. |
| color | **string** | [object Object] | The color of the line. If not specified, a unique color will be assigned automatically. |
| isSelectedInWorkbench | **boolean** |  | The selection state of the line in the workbench. |
| time | **object** | [object Object] | Options for controlling how the visualization changes with time. |
| timeColumn | **string** |  | The column that indicates the time of a sample or the start time of an interval. |
| endTimeColumn | **string** |  | The column that indicates the end time of an interval. |
| idColumns | **string** |  | The columns that identify an entity as it changes over time. |
| isSampled | **boolean** |  | True if the rows in this CSV correspond to "sampled" data, and so the feature position, color, and size should be interpolated to produce smooth animation of the features over time. If False, then times are treated as the start of discrete periods and feature positions, colors, and sizes are kept constant until the next time. This value is ignored if the CSV does not have both a time column and an ID column. |
| displayDuration | **number** |  | Display duration for each row in the table, in minutes. |

### Observable properties
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| identifier | **string** |  | A string that identifies the property when communicating with the server. |
| title | **string** |  | A display title. |
| units | **string** |  | The unit of the property value |
| defaultDuration | **string** |  | The intervals between observations. eg: 10d - Final character must be s, h, d or y for seconds, hours, days or years. |

### Procedures
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| identifier | **string** |  | A string that identifies the property when communicating with the server. |
| title | **string** |  | A display title. |
| units | **string** |  | The unit of the property value |
| defaultDuration | **string** |  | The intervals between observations. eg: 10d - Final character must be s, h, d or y for seconds, hours, days or years. |
