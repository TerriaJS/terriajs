
# ShapefileCatalogItem




`"type": "shp"`


## ShapefileCatalogItemTraits

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

<tr><td colspan=4><b>AttributionTraits</b></td></tr>

<tr>
  <td><code>attribution</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The attribution to display with the data.</p>
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
  <td></td>
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

<tr><td colspan=4><b>FeatureInfoTraits</b></td></tr>

<tr>
  <td><code>featureInfoTemplate</code></td>
  <td><a href="#FeatureInfoTemplateTraits"><code>FeatureInfoTemplateTraits</code></b></td>
  <td></td>
  <td><p>A template object for formatting content in feature info panel</p>
</td>
</tr>

<tr>
  <td><code>featureInfoUrlTemplate</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A template URL string for fetching feature info. Template values of the form {x} will be replaced with corresponding property values from the picked feature.</p>
</td>
</tr>

<tr>
  <td><code>showStringIfPropertyValueIsNull</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>If the value of a property is null or undefined, show the specified string as the value of the property. Otherwise, the property name will not be listed at all.</p>
</td>
</tr>

<tr><td colspan=4><b>GeoJsonTraits</b></td></tr>

<tr>
  <td><code>style</code></td>
  <td><a href="#StyleTraits"><code>StyleTraits</code></b></td>
  <td></td>
  <td><p>Styling rules that follow <a href="https://github.com/mapbox/simplestyle-spec">simplestyle-spec</a></p>
</td>
</tr>

<tr>
  <td><code>clampToGround</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Whether the features in this GeoJSON should be clamped to the terrain surface.</p>
</td>
</tr>

<tr>
  <td><code>perPropertyStyles</code></td>
  <td><a href="#PerPropertyGeoJsonStyleTraits"><code>PerPropertyGeoJsonStyleTraits[]</code></b></td>
  <td></td>
  <td><p>Override feature styles according to their properties.</p>
</td>
</tr>

<tr>
  <td><code>timeProperty</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The property of each GeoJSON feature that specifies which point in time that feature is associated with. If not specified, it is assumed that the dataset is constant throughout time.</p>
</td>
</tr>

<tr>
  <td><code>heightProperty</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The property of each GeoJSON feature that specifies the height. If defined, polygons will be extruded to this property (in meters) above terrain.</p>
</td>
</tr>

<tr>
  <td><code>czmlTemplate</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>CZML template to be used to replace each GeoJSON Point feature. Feature coordinates and properties will automatically be applied to CZML packet, so they can be used as references. If this is defined, <code>clampToGround</code>, <code>style</code>, <code>perPropertyStyles</code>, <code>timeProperty</code> and <code>heightProperty</code> will be ignored.</p>
<pre><code>For example - this will render a cylinder for every point (and use the length and radius feature properties)
  ```json
  {
    cylinder: {
      length: {
        reference: &quot;#properties.length&quot;
      },
      topRadius: {
        reference: &quot;#properties.radius&quot;
      },
      bottomRadius: {
        reference: &quot;#properties.radius&quot;
      },
      material: {
        solidColor: {
          color: {
            rgba: [0, 200, 0, 20]
          }
        }
      }
    }
  }
  ```</code></pre>
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
  <td></td>
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

<tr><td colspan=4><b>TimeVaryingTraits</b></td></tr>

<tr>
  <td><code>currentTime</code></td>
  <td><code>string</code></td>
  <td><code>2021-08-09T03:19:11.8870000Z</code></td>
  <td><p>The current time at which to show this dataset.</p>
</td>
</tr>

<tr>
  <td><code>initialTimeSource</code></td>
  <td><code>string</code></td>
  <td><code>now</code></td>
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
  <td><code>1d</code></td>
  <td><p>The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds).</p>
</td>
</tr>
  </tbody>
</table>

## QueryParamTraits

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
  <td><code>id</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Dimension ID</p>
</td>
</tr>

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


## FeatureInfoTemplateTraits

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
  <td><p>A mustache template string for formatting name</p>
</td>
</tr>

<tr>
  <td><code>template</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A Mustache template string for formatting description</p>
</td>
</tr>

<tr>
  <td><code>partials</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>An object, mapping partial names to a template string. Defines the partials used in Template.</p>
</td>
</tr>

<tr>
  <td><code>formats</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>An object, mapping field names to formatting options.</p>
</td>
</tr>
  </tbody>
</table>


## StyleTraits

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
  <td><code>marker-size</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Marker size. Valid values are <code>small</code>, <code>medium</code>, or <code>large</code>. If the value is a number, it is the size in pixels.</p>
</td>
</tr>

<tr>
  <td><code>marker-color</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Marker color</p>
</td>
</tr>

<tr>
  <td><code>marker-symbol</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Marker symbol.</p>
</td>
</tr>

<tr>
  <td><code>marker-opacity</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Marker opacity.</p>
</td>
</tr>

<tr>
  <td><code>marker-url</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Marker URL.</p>
</td>
</tr>

<tr>
  <td><code>stroke</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Stroke color.</p>
</td>
</tr>

<tr>
  <td><code>stroke-opacity</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Stroke opacity.</p>
</td>
</tr>

<tr>
  <td><code>stroke-width</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Stroke width.</p>
</td>
</tr>

<tr>
  <td><code>fill</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Fill color.</p>
</td>
</tr>

<tr>
  <td><code>fill-opacity</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Fill opacity.</p>
</td>
</tr>
  </tbody>
</table>


## PerPropertyGeoJsonStyleTraits

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
  <td><code>properties</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>If the properties of a feature match these properties, then apply the style to that feature</p>
</td>
</tr>

<tr>
  <td><code>style</code></td>
  <td><a href="#StyleTraits"><code>StyleTraits</code></b></td>
  <td></td>
  <td><p>Styling rules to apply, following <a href="https://github.com/mapbox/simplestyle-spec">simplestyle-spec</a></p>
</td>
</tr>

<tr>
  <td><code>caseSensitive</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>True if properties should be matched in a case sensitive fashion</p>
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