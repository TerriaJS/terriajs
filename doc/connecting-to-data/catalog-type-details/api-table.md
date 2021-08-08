
# ApiTableCatalogItem




`"type": "api-table"`


## ApiTableCatalogItemTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>apis</code></td>
  <td><a href="#ApiTableRequestTraits"><code>ApiTableRequestTraits[]</code></b></td>
  <td></td>
  <td><p>The apis to use to retrieve the columns of the table. Note: you <strong>must</strong> define which columns to use from API response in the <code>columns</code> <code>TableColumnTraits</code> - for example <code>[{name:&quot;some-key-in-api-response&quot;, ...}]</code></p>
</td>
</tr>

<tr>
  <td><code>idKey</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of the id property shared between all APIs</p>
</td>
</tr>

<tr><td colspan=4><b>ApiRequestTraits</b></td></tr>

<tr>
  <td><code>queryParameters</code></td>
  <td><a href="#QueryParamTraits"><code>QueryParamTraits[]</code></b></td>
  <td></td>
  <td><p>Query parameters to supply to the API</p>
</td>
</tr>

<tr>
  <td><code>updateQueryParameters</code></td>
  <td><a href="#QueryParamTraits"><code>QueryParamTraits[]</code></b></td>
  <td></td>
  <td><p>Query parameters to supply to the API on subsequent calls after the first call.</p>
</td>
</tr>

<tr>
  <td><code>requestData</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>JSON body to be sent with the HTTP request to the server. If provided, the request will be made as POST rather than a GET.</p>
</td>
</tr>

<tr>
  <td><code>postRequestDataAsFormData</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Send the request data as form data instead of a JSON body.</p>
</td>
</tr>

<tr><td colspan=4><b>ApiTableRequestTraits</b></td></tr>

<tr>
  <td><code>kind</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Determines how table rows are constructed from this API.</p>
<ul>
<li>PER_ROW: values are specific to a row in the table</li>
<li>PER_ID: values are the same for all objects with the same id</li>
</ul>
</td>
</tr>

<tr><td colspan=4><b>AttributionTraits</b></td></tr>

<tr>
  <td><code>attribution</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The attribution to display with the data.</p>
</td>
</tr>

<tr><td colspan=4><b>AutoRefreshingTraits</b></td></tr>

<tr>
  <td><code>refreshInterval</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>How often the data in this model is refreshed, in seconds</p>
</td>
</tr>

<tr>
  <td><code>refreshEnabled</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Toggle for enabling auto refresh.</p>
</td>
</tr>

<tr><td colspan=4><b>CatalogMemberTraits</b></td></tr>

<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of the catalog item.</p>
</td>
</tr>

<tr>
  <td><code>description</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The description of the catalog item. Markdown and HTML may be used.</p>
</td>
</tr>

<tr>
  <td><code>nameInCatalog</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of the item to be displayed in the catalog, if it is different from the one to display in the workbench.</p>
</td>
</tr>

<tr>
  <td><code>info</code></td>
  <td><a href="#InfoSectionTraits"><code>InfoSectionTraits[]</code></b></td>
  <td></td>
  <td><p>Human-readable information about this dataset.</p>
</td>
</tr>

<tr>
  <td><code>infoSectionOrder</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>An array of section titles definining the display order of info sections. If this property is not defined, {@link DataPreviewSections}'s DEFAULT_SECTION_ORDER is used</p>
</td>
</tr>

<tr>
  <td><code>isOpenInWorkbench</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Whether the item in the workbench open or collapsed.</p>
</td>
</tr>

<tr>
  <td><code>shortReport</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A short report to show on the now viewing tab.</p>
</td>
</tr>

<tr>
  <td><code>shortReportSections</code></td>
  <td><a href="#ShortReportTraits"><code>ShortReportTraits[]</code></b></td>
  <td></td>
  <td><p>A list of collapsible sections of the short report</p>
</td>
</tr>

<tr>
  <td><code>isExperiencingIssues</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Whether the catalog item is experiencing issues which may cause its data to be unavailable</p>
</td>
</tr>

<tr>
  <td><code>hideLegendInWorkbench</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Whether the legend is hidden in the workbench for this catalog member.</p>
</td>
</tr>

<tr>
  <td><code>legends</code></td>
  <td><a href="#LegendTraits"><code>LegendTraits[]</code></b></td>
  <td></td>
  <td><p>The legends to display on the workbench.</p>
</td>
</tr>

<tr>
  <td><code>hideSource</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Indicates that the source of this data should be hidden from the UI (obviously this isn't super-secure as you can just look at the network requests).</p>
</td>
</tr>

<tr>
  <td><code>metadataUrls</code></td>
  <td><a href="#MetadataUrlTraits"><code>MetadataUrlTraits[]</code></b></td>
  <td></td>
  <td><p>Metadata URLs to show in data catalog.</p>
</td>
</tr>

<tr>
  <td><code>dataCustodian</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Gets or sets a description of the custodian of this data item.</p>
</td>
</tr>

<tr>
  <td><code>modelDimensions</code></td>
  <td><a href="#DimensionTraits"><code>DimensionTraits[]</code></b></td>
  <td></td>
  <td><p>This provides ability to set model JSON through SelectableDimensions (a dropdown).</p>
</td>
</tr>

<tr>
  <td><code>disableAboutData</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Disables the 'About Data' button in the workbench.</p>
</td>
</tr>

<tr><td colspan=4><b>ChartPointOnMapTraits</b></td></tr>

<tr>
  <td><code>chartPointOnMap</code></td>
  <td><a href="#LatLonHeightTraits"><code>LatLonHeightTraits</code></b></td>
  <td></td>
  <td><p>The point on map where the current chart for the item was generated from. A marker will be shown at this point if the chart is active.</p>
</td>
</tr>

<tr><td colspan=4><b>DiscretelyTimeVaryingTraits</b></td></tr>

<tr>
  <td><code>fromContinuous</code></td>
  <td><code>string</code></td>
  <td><code>nearest</code></td>
  <td><p>Specifies how a continuous time (e.g. the timeline control) is mapped to a discrete time for this dataset. Valid values are: <br/> * <code>nearest</code> - the nearest available discrete time to the current continuous time is used. <br/> * <code>next</code> - the discrete time equal to or after the current continuous time is used. <br/> * <code>previous</code> - the discrete time equal to or before the current continuous time is used.</p>
</td>
</tr>

<tr>
  <td><code>showInChartPanel</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Whether to plot data availability on a chart.</p>
</td>
</tr>

<tr>
  <td><code>chartType</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Type determines how the data availibility will be plotted on chart. eg: momentLines, momentPoints</p>
</td>
</tr>

<tr>
  <td><code>chartDisclaimer</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A HTML string to show above the chart as a disclaimer</p>
</td>
</tr>

<tr>
  <td><code>chartColor</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The color to use when the data set is displayed on the chart. The value can be any html color string, eg: 'cyan' or '#00ffff' or 'rgba(0, 255, 255, 1)' for the color cyan.</p>
</td>
</tr>

<tr>
  <td><code>disableDateTimeSelector</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>When true, disables the date time selector in the workbench</p>
</td>
</tr>

<tr>
  <td><code>multiplierDefaultDeltaStep</code></td>
  <td><code>number</code></td>
  <td><code>2</code></td>
  <td><p>The multiplierDefaultDeltaStep is used to set the default multiplier (see <code>TimeVaryingTraits.multiplier</code> trait) - it represents the average number of (real-time) seconds between (dataset) time steps. For example, a value of five would set the <code>multiplier</code> so that a new time step (of this dataset) would appear every five seconds (on average) if the timeline is playing. This trait will only take effect if <code>multiplier</code> is <strong>not</strong> explicitly set.</p>
</td>
</tr>

<tr><td colspan=4><b>ExportableTraits</b></td></tr>

<tr>
  <td><code>disableExport</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Disable user export functionality</p>
</td>
</tr>

<tr><td colspan=4><b>LayerOrderingTraits</b></td></tr>

<tr>
  <td><code>keepOnTop</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Keeps the layer on top of all other imagery layers.</p>
</td>
</tr>

<tr>
  <td><code>supportsReordering</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Does this layer support reordering in the workbench.</p>
</td>
</tr>

<tr><td colspan=4><b>MappableTraits</b></td></tr>

<tr>
  <td><code>rectangle</code></td>
  <td><a href="#RectangleTraits"><code>RectangleTraits</code></b></td>
  <td></td>
  <td><p>The bounding box rectangle that contains all the data in this catalog item.</p>
</td>
</tr>

<tr>
  <td><code>disablePreview</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Disables the preview on the Add Data panel. This is useful when the preview will be very slow to load.</p>
</td>
</tr>

<tr>
  <td><code>disableZoomTo</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Disables the zoom to (aka 'Ideal Zoom') button in the workbench.</p>
</td>
</tr>

<tr>
  <td><code>show</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel.</p>
</td>
</tr>

<tr>
  <td><code>initialMessage</code></td>
  <td><a href="#InitialMessageTraits"><code>InitialMessageTraits</code></b></td>
  <td></td>
  <td><p>A message to show when the user adds the catalog item to the workbench. Useful for showing disclaimers.</p>
</td>
</tr>

<tr><td colspan=4><b>RasterLayerTraits</b></td></tr>

<tr>
  <td><code>opacity</code></td>
  <td><code>number</code></td>
  <td><code>0.8</code></td>
  <td><p>The opacity of the map layers.</p>
</td>
</tr>

<tr>
  <td><code>leafletUpdateInterval</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Update a tile only once during this interval when the map is panned. Value should be specified in milliseconds.</p>
</td>
</tr>

<tr>
  <td><code>tileErrorHandlingOptions</code></td>
  <td><a href="#TileErrorHandlingTraits"><code>TileErrorHandlingTraits</code></b></td>
  <td></td>
  <td><p>Options for handling tile errors</p>
</td>
</tr>

<tr>
  <td><code>clipToRectangle</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Gets or sets a value indicating whether this dataset should be clipped to the {@link CatalogItem#rectangle}.
If true, no part of the dataset will be displayed outside the rectangle.
This property is true by default, leading to better performance and avoiding tile request errors that might occur when requesting tiles outside the server-specified rectangle.
However, it may also cause features to be cut off in some cases, such as if a server reports an extent that does not take into account that the representation of features sometimes require a larger spatial extent than the features themselves.
For example, if a point feature on the edge of the extent is drawn as a circle with a radius of 5 pixels, half of that circle will be cut off.</p>
</td>
</tr>

<tr><td colspan=4><b>SplitterTraits</b></td></tr>

<tr>
  <td><code>splitDirection</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The side of the splitter to display this imagery layer on. Defaults to both sides.</p>
</td>
</tr>

<tr>
  <td><code>disableSplitter</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>If true, splitter funcitonality will be hidden for this model.</p>
</td>
</tr>

<tr><td colspan=4><b>TableTraits</b></td></tr>

<tr>
  <td><code>showUnmatchedRegionsWarning</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>True to show a warning when some of the region IDs in the CSV file could not be matched to a region. False to silently ignore unmatched regions.</p>
</td>
</tr>

<tr>
  <td><code>columns</code></td>
  <td><a href="#TableColumnTraits"><code>TableColumnTraits[]</code></b></td>
  <td></td>
  <td><p>Options for individual columns in the CSV.</p>
</td>
</tr>

<tr>
  <td><code>defaultColumn</code></td>
  <td><a href="#TableColumnTraits"><code>TableColumnTraits</code></b></td>
  <td></td>
  <td><p>The default settings to use for all columns</p>
</td>
</tr>

<tr>
  <td><code>styles</code></td>
  <td><a href="#TableStyleTraits"><code>TableStyleTraits[]</code></b></td>
  <td></td>
  <td><p>The set of styles that can be used to visualize this dataset.</p>
</td>
</tr>

<tr>
  <td><code>defaultStyle</code></td>
  <td><a href="#TableStyleTraits"><code>TableStyleTraits</code></b></td>
  <td></td>
  <td><p>The default style to apply when visualizing any column in this CSV.</p>
</td>
</tr>

<tr>
  <td><code>activeStyle</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The ID of the currently-selected style.</p>
</td>
</tr>

<tr>
  <td><code>enableManualRegionMapping</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>If enabled, there will be controls to set region column and region type.</p>
</td>
</tr>

<tr>
  <td><code>columnTitles</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>An optional array of column titles that override the individual <code>TableColumnTraits.title</code> setting.</p>
</td>
</tr>

<tr>
  <td><code>columnUnits</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>An optional array of column units that override the individual <code>TableColumnTraits.unit</code> setting.</p>
</td>
</tr>

<tr>
  <td><code>removeDuplicateRows</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>If two rows in the table are identical, only retain one copy. This could cause performance issues, and so should be used only when absolutely necessary.</p>
</td>
</tr>

<tr><td colspan=4><b>TimeVaryingTraits</b></td></tr>

<tr>
  <td><code>currentTime</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The current time at which to show this dataset.</p>
</td>
</tr>

<tr>
  <td><code>initialTimeSource</code></td>
  <td><code>string</code></td>
  <td><code>start</code></td>
  <td><p>The initial time to use if <code>Current Time</code> is not specified. Valid values are <br/> * <code>start</code> - the dataset's start time <br/> * <code>stop</code> - the dataset's stop time <br/> * <code>now</code> - the current system time. If the system time is after <code>Stop Time</code>, <code>Stop Time</code> is used. If the system time is before <code>Start Time</code>, <code>Start Time</code> is used. <br/> * <code>none</code> - do not automatically set an initial time <br/> This value is ignored if <code>Current Time</code> is specified.</p>
</td>
</tr>

<tr>
  <td><code>startTime</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The earliest time for which this dataset is available. This will be the start of the range shown on the timeline control.</p>
</td>
</tr>

<tr>
  <td><code>stopTime</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The latest time for which this dataset is available. This will be the end of the range shown on the timeline control.</p>
</td>
</tr>

<tr>
  <td><code>multiplier</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The multiplier to use in progressing time for this dataset. For example, <code>5.0</code> means that five seconds of dataset time will pass for each one second of real time.</p>
</td>
</tr>

<tr>
  <td><code>isPaused</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>True if time is currently paused for this dataset, or false if it is progressing.</p>
</td>
</tr>

<tr>
  <td><code>dateFormat</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A dateformat string (using the dateformat package) used to adjust the presentation of the date in various spots in the UI for a catalog item. <br/>For example, to just show the year set to 'yyyy'. Used in places like the the Workbench Item and Bottom Dock</p>
</td>
</tr>

<tr><td colspan=4><b>UrlTraits</b></td></tr>

<tr>
  <td><code>url</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The base URL of the file or service.</p>
</td>
</tr>

<tr>
  <td><code>forceProxy</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Force the default proxy to be used for all network requests.</p>
</td>
</tr>

<tr>
  <td><code>cacheDuration</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds).</p>
</td>
</tr>
  </tbody>
</table>

## ApiTableRequestTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>kind</code></td>
  <td><code>string</code></td>
  <td><code>PER_ROW</code></td>
  <td><p>Determines how table rows are constructed from this API.</p>
<ul>
<li>PER_ROW: values are specific to a row in the table</li>
<li>PER_ID: values are the same for all objects with the same id</li>
</ul>
</td>
</tr>

<tr><td colspan=4><b>ApiRequestTraits</b></td></tr>

<tr>
  <td><code>queryParameters</code></td>
  <td><a href="#QueryParamTraits"><code>QueryParamTraits[]</code></b></td>
  <td></td>
  <td><p>Query parameters to supply to the API</p>
</td>
</tr>

<tr>
  <td><code>updateQueryParameters</code></td>
  <td><a href="#QueryParamTraits"><code>QueryParamTraits[]</code></b></td>
  <td></td>
  <td><p>Query parameters to supply to the API on subsequent calls after the first call.</p>
</td>
</tr>

<tr>
  <td><code>requestData</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>JSON body to be sent with the HTTP request to the server. If provided, the request will be made as POST rather than a GET.</p>
</td>
</tr>

<tr>
  <td><code>postRequestDataAsFormData</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Send the request data as form data instead of a JSON body.</p>
</td>
</tr>

<tr><td colspan=4><b>UrlTraits</b></td></tr>

<tr>
  <td><code>url</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The base URL of the file or service.</p>
</td>
</tr>

<tr>
  <td><code>forceProxy</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Force the default proxy to be used for all network requests.</p>
</td>
</tr>

<tr>
  <td><code>cacheDuration</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds).</p>
</td>
</tr>
  </tbody>
</table>

### QueryParamTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of the query parameter.</p>
</td>
</tr>

<tr>
  <td><code>value</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The value of the query parameter. Parameter values starting with <code>DATE!</code>, eg. <code>DATE!HH:MM</code>, will be replaced wih the current date and time, formatted according to the format string following the <code>!</code>. For more information on the format string format, see the  <a href="https://github.com/felixge/node-dateformat">dateformat</a> library.</p>
</td>
</tr>
  </tbody>
</table>


## InfoSectionTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of the section.</p>
</td>
</tr>

<tr>
  <td><code>content</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The content of the section, in Markdown and HTML format. Set this property to null to remove this section entirely.</p>
</td>
</tr>

<tr>
  <td><code>contentAsObject</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>The content of the section which is a JSON object. Set this property to null to remove this section entirely.</p>
</td>
</tr>

<tr>
  <td><code>show</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Indicates if this info section showing (not collapsed).</p>
</td>
</tr>
  </tbody>
</table>


## ShortReportTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of the section.</p>
</td>
</tr>

<tr>
  <td><code>content</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The content of the section.</p>
</td>
</tr>

<tr>
  <td><code>show</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Indicates if this short report section showing.</p>
</td>
</tr>
  </tbody>
</table>


## LegendTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>title</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A title to be displayed above the legend.</p>
</td>
</tr>

<tr>
  <td><code>url</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The URL of the legend image.</p>
</td>
</tr>

<tr>
  <td><code>imageScaling</code></td>
  <td><code>number</code></td>
  <td><code>1</code></td>
  <td><p>Scaling of the legend. For example, a high DPI legend may have scaling = <code>0.5</code>, so it will be scaled doown 50%</p>
</td>
</tr>

<tr>
  <td><code>urlMimeType</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The MIME type of the <code>URL</code> legend image.</p>
</td>
</tr>

<tr>
  <td><code>items</code></td>
  <td><a href="#LegendItemTraits"><code>LegendItemTraits[]</code></b></td>
  <td></td>
  <td></td>
</tr>
  </tbody>
</table>

### LegendItemTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>title</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The title to display next to this legend item.</p>
</td>
</tr>

<tr>
  <td><code>multipleTitles</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Multiple titles to display next to this legend item.</p>
</td>
</tr>

<tr>
  <td><code>maxMultipleTitlesShowed</code></td>
  <td><code>string</code></td>
  <td><code>10</code></td>
  <td><p>Maximum number of multiple titles to display next to this legend item. (Default is 10)</p>
</td>
</tr>

<tr>
  <td><code>titleAbove</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The title to display above this legend item, i.e. marking the top of a box on the legend.</p>
</td>
</tr>

<tr>
  <td><code>titleBelow</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The title to display below this legend item, i.e. marking the bottom of a box on the legend.</p>
</td>
</tr>

<tr>
  <td><code>color</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The CSS color to display for this item. This property is ignored if <code>Legend URL</code> is specified.</p>
</td>
</tr>

<tr>
  <td><code>outlineColor</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The CSS color with which to outline this item.</p>
</td>
</tr>

<tr>
  <td><code>multipleColors</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>Multiple colors to show with this item in a grid arrangement.</p>
</td>
</tr>

<tr>
  <td><code>imageUrl</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The URL of an image to display with this item.</p>
</td>
</tr>

<tr>
  <td><code>addSpacingAbove</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>True to add a bit of extra spacing above this item in order to separate it visually from the rest of the legend.</p>
</td>
</tr>

<tr>
  <td><code>imageHeight</code></td>
  <td><code>number</code></td>
  <td><code>20</code></td>
  <td><p>The height of the legend image.</p>
</td>
</tr>

<tr>
  <td><code>imageWidth</code></td>
  <td><code>number</code></td>
  <td><code>20</code></td>
  <td><p>The width of the legend image.</p>
</td>
</tr>
  </tbody>
</table>


## MetadataUrlTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>url</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The metadata URL of the file or service.</p>
</td>
</tr>

<tr>
  <td><code>title</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Title used for metadata URL button.</p>
</td>
</tr>
  </tbody>
</table>


## DimensionTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Dimension name (human-readable)</p>
</td>
</tr>

<tr>
  <td><code>options</code></td>
  <td><a href="#DimensionOptionTraits"><code>DimensionOptionTraits[]</code></b></td>
  <td></td>
  <td><p>Dimension options</p>
</td>
</tr>

<tr>
  <td><code>selectedId</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Selected Option's ID</p>
</td>
</tr>

<tr>
  <td><code>allowUndefined</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Allow dimension to be undefined</p>
</td>
</tr>

<tr>
  <td><code>disable</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Hides dimension</p>
</td>
</tr>

<tr><td colspan=4><b>ModelOverrideTraits</b></td></tr>

<tr>
  <td><code>id</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Concept ID (full URN form - urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=ABS:CS_C16_COMMON(1.0.0).REGION)</p>
</td>
</tr>

<tr>
  <td><code>type</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Override concept/dimension type - Possible values are:
- 'region': values contain region codes used for region mapping - eg Country code)
- 'region-type': values contains region types - eg 'CNT2' which is 2-letter country codes)
- 'unit-measure': values should be used to describe primary-measure (eg in chart title)
- 'unit-multiplier': multiply primary-measure value by atrtibute values
- 'frequency': value used to determine time period frequency (ie. yearly, monthly...)</p>
</td>
</tr>

<tr>
  <td><code>regionType</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>If <code>type</code> has been specified as 'region', you can also manually specify the region type (eg SA2 for ABS Statistical Area 2)</p>
</td>
</tr>

<tr>
  <td><code>regionTypeReplacements</code></td>
  <td><a href="#ReplaceStringTraits"><code>ReplaceStringTraits[]</code></b></td>
  <td></td>
  <td><p>If <code>type</code> has been specified as 'region' and this dataflow contains multiple regionTypes - you can add a map to correct automatically detected region types. For example: setting <code>regionTypeReplacements = [{find: 'SA1_2016', replace: 'SA1_2011'}]</code> will replace <code>regionType</code> with <code>SA1_2011</code> if it was <code>SA1_2016</code></p>
</td>
</tr>

<tr><td colspan=4><b>SdmxDimensionTraits</b></td></tr>

<tr>
  <td><code>position</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The position attribute specifies the position of the dimension in the data structure definition, starting at 0. This is important for making sdmx-csv requests</p>
</td>
</tr>
  </tbody>
</table>

### DimensionOptionTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>id</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Option ID</p>
</td>
</tr>

<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Option name (human-readable)</p>
</td>
</tr>

<tr>
  <td><code>value</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>Value (if this is undefined, <code>id</code> will be used)</p>
</td>
</tr>
  </tbody>
</table>


### ReplaceStringTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>find</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>String to find</p>
</td>
</tr>

<tr>
  <td><code>replace</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>String to replace with</p>
</td>
</tr>
  </tbody>
</table>


## LatLonHeightTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>latitude</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Latitude in degrees</p>
</td>
</tr>

<tr>
  <td><code>longitude</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Longitude in degrees</p>
</td>
</tr>

<tr>
  <td><code>height</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Height above ellipsoid in metres</p>
</td>
</tr>
  </tbody>
</table>


## RectangleTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>west</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The westernmost longitude in degrees.</p>
</td>
</tr>

<tr>
  <td><code>south</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The southernmost longitude in degrees.</p>
</td>
</tr>

<tr>
  <td><code>east</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The easternmost longitude in degrees.</p>
</td>
</tr>

<tr>
  <td><code>north</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The northernmost longitude in degrees.</p>
</td>
</tr>
  </tbody>
</table>


## InitialMessageTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>title</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The title of the message.</p>
</td>
</tr>

<tr>
  <td><code>content</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The content of the message.</p>
</td>
</tr>

<tr>
  <td><code>key</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Identifier. If multiple messages with the same key are triggered, only the first will be displayed.</p>
</td>
</tr>

<tr>
  <td><code>confirmation</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Whether the message requires confirmation.</p>
</td>
</tr>

<tr>
  <td><code>confirmText</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>If <code>confirmation</code> is true, the text to put on the confirmation button.</p>
</td>
</tr>

<tr>
  <td><code>width</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Width of the message.</p>
</td>
</tr>

<tr>
  <td><code>height</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Height of the message.</p>
</td>
</tr>
  </tbody>
</table>


## TileErrorHandlingTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>thresholdBeforeDisablingItem</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The number of tile failures before disabling the item.</p>
</td>
</tr>

<tr>
  <td><code>treat403AsError</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Indicates whether a 403 response code when requesting a tile should be treated as an error. If false, 403s are assumed to just be missing tiles and need not be reported to the user.</p>
</td>
</tr>

<tr>
  <td><code>treat404AsError</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Indicates whether a 404 response code when requesting a tile should be treated as an error. If false, 404s are assumed to just be missing tiles and need not be reported to the user.</p>
</td>
</tr>

<tr>
  <td><code>ignoreUnknownTileErrors</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>A flag indicating whether non-specific (no HTTP status code) tile errors should be ignored. This is a last resort, for dealing with odd cases such as data sources that return non-images (eg XML) with a 200 status code. No error messages will be shown to the user.</p>
</td>
</tr>
  </tbody>
</table>


## TableColumnTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of the column.</p>
</td>
</tr>

<tr>
  <td><code>title</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The displayed title of the column.</p>
</td>
</tr>

<tr>
  <td><code>units</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The units for the column values.</p>
</td>
</tr>

<tr>
  <td><code>transformation</code></td>
  <td><a href="#ColumnTransformationTraits"><code>ColumnTransformationTraits</code></b></td>
  <td></td>
  <td><p>Transformation to apply to this column</p>
</td>
</tr>

<tr>
  <td><code>type</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The type of the column. If not specified, the type is guessed from the column's name and values. Valid types are:</p>
<ul>
<li><code>0</code></li>
<li><code>1</code></li>
<li><code>2</code></li>
<li><code>3</code></li>
<li><code>4</code></li>
<li><code>5</code></li>
<li><code>6</code></li>
<li><code>7</code></li>
<li><code>8</code></li>
<li><code>9</code></li>
<li><code>longitude</code></li>
<li><code>latitude</code></li>
<li><code>height</code></li>
<li><code>time</code></li>
<li><code>scalar</code></li>
<li><code>enum</code></li>
<li><code>region</code></li>
<li><code>text</code></li>
<li><code>address</code></li>
<li><code>hidden</code></li>
</ul>
</td>
</tr>

<tr>
  <td><code>regionType</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The type of region referenced by the values in this column. If <code>Type</code> is not defined and this value can be resolved, the column <code>Type</code> will be <code>region</code>.</p>
</td>
</tr>

<tr>
  <td><code>regionDisambiguationColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of the column to use to disambiguate region matches in this column.</p>
</td>
</tr>

<tr>
  <td><code>replaceWithZeroValues</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>Values of the column to replace with 0.0, such as <code>-</code>.</p>
</td>
</tr>

<tr>
  <td><code>replaceWithNullValues</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>Values of the column to replace with null, such as <code>NA</code>.</p>
</td>
</tr>

<tr>
  <td><code>format</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>The formatting options to pass to <code>toLocaleString</code> when formatting the values of this column for the legend and feature information panels. See:
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString">https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString</a>
and <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat">https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat</a></p>
</td>
</tr>
  </tbody>
</table>

### ColumnTransformationTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>expression</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Transformation expression used to change column values (row-by-row). This uses <a href="http://bugwheels94.github.io/math-expression-evaluator">http://bugwheels94.github.io/math-expression-evaluator</a> . For example  <code>x*3</code> will multiply all column values by 3, <code>x*columnA</code> will multiple this column with <code>columnA</code> (note - <code>columnA</code> must be in <code>dependencies</code> array).</p>
</td>
</tr>

<tr>
  <td><code>dependencies</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>Array of column names which are 'injected' in to the expression. For example, to use the expression <code>x*columnA</code> (where <code>columnA</code> is the name of another column), <code>dependencies</code> must include <code>'columnA'</code></p>
</td>
</tr>
  </tbody>
</table>


## TableStyleTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>id</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The ID of the style.</p>
</td>
</tr>

<tr>
  <td><code>title</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The human-readable title of the style. Set this to null to remove the style entirely.</p>
</td>
</tr>

<tr>
  <td><code>legendTitle</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The title to show on the legend. If not specified, <code>Title</code> is used.</p>
</td>
</tr>

<tr>
  <td><code>regionColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The column to use for region mapping.</p>
</td>
</tr>

<tr>
  <td><code>latitudeColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The column to use for the latitude of points. If <code>Region Column</code> is specified, this property is ignored.</p>
</td>
</tr>

<tr>
  <td><code>longitudeColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The column to use for the longitude of points. If <code>Region Column</code> is specified, this property is ignored.</p>
</td>
</tr>

<tr>
  <td><code>color</code></td>
  <td><a href="#TableColorStyleTraits"><code>TableColorStyleTraits</code></b></td>
  <td></td>
  <td><p>Options for controlling the color of points or regions.</p>
</td>
</tr>

<tr>
  <td><code>pointSize</code></td>
  <td><a href="#TablePointSizeStyleTraits"><code>TablePointSizeStyleTraits</code></b></td>
  <td></td>
  <td><p>Options for controlling the size of points. This property is ignored for regions.</p>
</td>
</tr>

<tr>
  <td><code>chart</code></td>
  <td><a href="#TableChartStyleTraits"><code>TableChartStyleTraits</code></b></td>
  <td></td>
  <td><p>Options for controlling the chart created from this CSV.</p>
</td>
</tr>

<tr>
  <td><code>time</code></td>
  <td><a href="#TableTimeStyleTraits"><code>TableTimeStyleTraits</code></b></td>
  <td></td>
  <td><p>Options for controlling how the visualization changes with time.</p>
</td>
</tr>

<tr>
  <td><code>hidden</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Hide style from &quot;Display Variable&quot; drop-down in workbench. It is hidden by default if number of colors (enumColors or numberOfBins) is less than 2 - as a ColorMap with a single color isn't super useful</p>
</td>
</tr>
  </tbody>
</table>

### TableColorStyleTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>colorColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The column to use to color points or regions.</p>
</td>
</tr>

<tr>
  <td><code>nullColor</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The color to use when the value is null, specified as a CSS color string.</p>
</td>
</tr>

<tr>
  <td><code>regionColor</code></td>
  <td><code>string</code></td>
  <td><code>#02528d</code></td>
  <td><p>The color to use when the styling the region, specified as a CSS color string.</p>
</td>
</tr>

<tr>
  <td><code>nullLabel</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The label to use in the legend for null values.</p>
</td>
</tr>

<tr>
  <td><code>minimumValue</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The minimum value to use when creating ColorMaps. This is only applied for <code>scalar</code> columns.</p>
</td>
</tr>

<tr>
  <td><code>maximumValue</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The maximum value to use when creating ColorMaps. This is only applied for <code>scalar</code> columns.</p>
</td>
</tr>

<tr>
  <td><code>numberOfBins</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The number of different colors to bin the data into. This property is ignored if <code>Bin Maximums</code> is specified for a <code>scalar</code> column or <code>Enum Colors</code> is specified for an <code>enum</code> column.</p>
</td>
</tr>

<tr>
  <td><code>binMaximums</code></td>
  <td><code>number[]</code></td>
  <td></td>
  <td><p>The maximum values of the bins to bin the data into, specified as an array of numbers. The first bin extends from the dataset's minimum value to the first value in this array. The second bin extends from the first value in this array to the second value in this array. And so on. If the maximum value of the dataset is greater than the last value in this array, an additional bin is added automatically. This property is ignored if the <code>Color Column</code> is not a scalar.</p>
</td>
</tr>

<tr>
  <td><code>binColors</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>The colors to use for the bins, each specified as a CSS color string. If there are more colors than bins, the extra colors are ignored. If there are more bins than colors, the colors are repeated as necessary.</p>
</td>
</tr>

<tr>
  <td><code>enumColors</code></td>
  <td><a href="#EnumColorTraits"><code>EnumColorTraits[]</code></b></td>
  <td></td>
  <td><p>The colors to use for enumerated values. This property is ignored if the <code>Color Column</code> type is not <code>enum</code>.</p>
</td>
</tr>

<tr>
  <td><code>colorPalette</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of a <a href="http://colorbrewer2.org/">ColorBrewer</a> palette to use when mapping values to colors. This property is ignored if <code>Bin Colors</code> is defined and has enough colors for all bins, or if <code>Enum Colors</code> is defined. The default value depends on the type of the <code>Color Column</code> and on the data. Scalar columns that cross zero will use the diverging purple-to-orange palette <code>PuOr</code>. Scala columns that do not cross zero will use the sequential Red palette <code>Reds</code>. All other scenarios will use the 21 color <code>HighContrast</code> palette.
D3 color schemes are also supported (<a href="https://github.com/d3/d3-scale-chromatic">https://github.com/d3/d3-scale-chromatic</a>) - but without <code>scheme</code> or <code>interpolate</code> string (for example - to use <code>interpolateViridis</code> - set <code>colorPalete = Viridis</code>).
This is case seensitive.</p>
</td>
</tr>

<tr>
  <td><code>legendTicks</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The number of tick marks (in addition to the top and bottom) to show on the legend when the <code>Color Bin Method</code> is set to <code>none</code> and <code>Color Bins</code> is not defined.</p>
</td>
</tr>

<tr>
  <td><code>legend</code></td>
  <td><a href="#LegendTraits"><code>LegendTraits</code></b></td>
  <td></td>
  <td><p>The legend to show with this style. If not specified, a suitable is created automatically from the other parameters.</p>
</td>
</tr>
  </tbody>
</table>

#### EnumColorTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>value</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The enumerated value to map to a color.</p>
</td>
</tr>

<tr>
  <td><code>color</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The CSS color to use for the enumerated value.</p>
</td>
</tr>
  </tbody>
</table>


### TablePointSizeStyleTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>pointSizeColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The column to use to size points.</p>
</td>
</tr>

<tr>
  <td><code>nullSize</code></td>
  <td><code>number</code></td>
  <td><code>9</code></td>
  <td><p>The point size, in pixels, to use when the column has no value.</p>
</td>
</tr>

<tr>
  <td><code>sizeFactor</code></td>
  <td><code>number</code></td>
  <td><code>14</code></td>
  <td><p>The size, in pixels, of the point is:
<code>Normalized Value * Size Factor + Size Offset</code>
where the Normalized Value is a value in the range 0 to 1 with 0 representing the lowest value in the column and 1 representing the highest.</p>
</td>
</tr>

<tr>
  <td><code>sizeOffset</code></td>
  <td><code>number</code></td>
  <td><code>10</code></td>
  <td><p>The size, in pixels, of the point is:
<code>Normalized Value * Size Factor + Size Offset</code>
where the Normalized Value is a value in the range 0 to 1 with 0 representing the lowest value in the column and 1 representing the highest.</p>
</td>
</tr>
  </tbody>
</table>


### TableChartStyleTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>xAxisColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The column to use as the X-axis.</p>
</td>
</tr>

<tr>
  <td><code>lines</code></td>
  <td><a href="#TableChartLineStyleTraits"><code>TableChartLineStyleTraits[]</code></b></td>
  <td></td>
  <td><p>Lines on the chart, each of which is formed by plotting a column as the Y-axis.</p>
</td>
</tr>
  </tbody>
</table>

#### TableChartLineStyleTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Chart line name (will replace y-column name).</p>
</td>
</tr>

<tr>
  <td><code>yAxisColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The column to use as the Y-axis.</p>
</td>
</tr>

<tr>
  <td><code>yAxisMinimum</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The minimum value to show on the Y axis of the chart.</p>
</td>
</tr>

<tr>
  <td><code>yAxisMaximum</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The maximum value to show on the Y axis of the chart.</p>
</td>
</tr>

<tr>
  <td><code>color</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The color of the line. If not specified, a unique color will be assigned automatically.</p>
</td>
</tr>

<tr>
  <td><code>isSelectedInWorkbench</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>The selection state of the line in the workbench.</p>
</td>
</tr>
  </tbody>
</table>


### TableTimeStyleTraits

<table>
  <thead>
      <tr>
          <th>Trait</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
      </tr>
  </thead>
  <tbody>
  


<tr>
  <td><code>timeColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The column that indicates the time of a sample or the start time of an interval.</p>
</td>
</tr>

<tr>
  <td><code>endTimeColumn</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The column that indicates the end time of an interval.</p>
</td>
</tr>

<tr>
  <td><code>idColumns</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>The columns that identify an entity as it changes over time.</p>
</td>
</tr>

<tr>
  <td><code>isSampled</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>True if the rows in this CSV correspond to &quot;sampled&quot; data, and so the feature position, color, and size should be interpolated to produce smooth animation of the features over time. If False, then times are treated as the start of discrete periods and feature positions, colors, and sizes are kept constant until the next time. This value is ignored if the CSV does not have both a time column and an ID column.</p>
</td>
</tr>

<tr>
  <td><code>displayDuration</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Display duration for each row in the table, in minutes.</p>
</td>
</tr>

<tr>
  <td><code>spreadStartTime</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Indicates if start time of feature should be &quot;spread&quot; so that all features are displayed at the earliest time step. This is useful for non-contiguous sensor data. If true, the earliest time step will display the earliest values for all features (eg sensor IDs) - even if the time value is <strong>after</strong> the earliest time step. This means that at time step 0, all features will be displayed.</p>
</td>
</tr>

<tr>
  <td><code>spreadFinishTime</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Indicates if finish time of feature should be &quot;spread&quot; so that all features are displayed at the latest time step. See also <code>spreadStartTime</code>.</p>
</td>
</tr>
  </tbody>
</table>