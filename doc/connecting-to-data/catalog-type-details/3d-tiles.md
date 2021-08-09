
# Cesium3DTilesCatalogItem




`"type": "3d-tiles"`


## Cesium3DTilesCatalogItemTraits

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

<tr><td colspan=4><b>Cesium3DTilesTraits</b></td></tr>

<tr>
  <td><code>ionAssetId</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The Cesium Ion asset id.</p>
</td>
</tr>

<tr>
  <td><code>ionAccessToken</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Cesium Ion access token id.</p>
</td>
</tr>

<tr>
  <td><code>ionServer</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>URL of the Cesium Ion API server.</p>
</td>
</tr>

<tr>
  <td><code>options</code></td>
  <td><a href="#OptionsTraits"><code>OptionsTraits</code></b></td>
  <td></td>
  <td><p>Additional options to pass to Cesium's Cesium3DTileset constructor.</p>
</td>
</tr>

<tr>
  <td><code>style</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>The style to use, specified according to the <a href="https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling">Cesium 3D Tiles Styling Language</a>.</p>
</td>
</tr>

<tr>
  <td><code>filters</code></td>
  <td><a href="#FilterTraits"><code>FilterTraits[]</code></b></td>
  <td></td>
  <td><p>The filters to apply to this catalog item.</p>
</td>
</tr>

<tr>
  <td><code>colorBlendMode</code></td>
  <td><code>string</code></td>
  <td><code>MIX</code></td>
  <td><p>The color blend mode decides how per-feature color is blended with color defined in the tileset. Acceptable values are HIGHLIGHT, MIX &amp; REPLACE as defined in the cesium documentation - <a href="https://cesium.com/docs/cesiumjs-ref-doc/Cesium3DTileColorBlendMode.html">https://cesium.com/docs/cesiumjs-ref-doc/Cesium3DTileColorBlendMode.html</a></p>
</td>
</tr>

<tr>
  <td><code>colorBlendAmount</code></td>
  <td><code>number</code></td>
  <td><code>0.5</code></td>
  <td><p>When the colorBlendMode is MIX this value is used to interpolate between source color and feature color. A value of 0.0 results in the source color while a value of 1.0 results in the feature color, with any value in-between resulting in a mix of the source color and feature color.</p>
</td>
</tr>

<tr>
  <td><code>featureIdProperties</code></td>
  <td><code>string[]</code></td>
  <td></td>
  <td><p>One or many properties of a feature that together identify it uniquely. This is useful for setting properties for individual features. eg: ['lat', 'lon'], ['buildingId'] etc.</p>
</td>
</tr>

<tr><td colspan=4><b>ClippingPlanesTraits</b></td></tr>

<tr>
  <td><code>clippingPlanes</code></td>
  <td><a href="#ClippingPlaneCollectionTraits"><code>ClippingPlaneCollectionTraits</code></b></td>
  <td></td>
  <td><p>The ClippingPlaneCollection used to selectively disable rendering the tileset.</p>
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

<tr><td colspan=4><b>HighlightColorTraits</b></td></tr>

<tr>
  <td><code>highlightColor</code></td>
  <td><code>string</code></td>
  <td><code>#ff3f00</code></td>
  <td><p>The color used to highlight a feature when it is picked. If not set, this defaults to <code>Terria.baseMapContrastColor</code></p>
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

<tr><td colspan=4><b>PlaceEditorTraits</b></td></tr>

<tr>
  <td><code>editing</code></td>
  <td><a href="#EditorTraits"><code>EditorTraits</code></b></td>
  <td></td>
  <td><p>Editor traits</p>
</td>
</tr>

<tr><td colspan=4><b>SearchableItemTraits</b></td></tr>

<tr>
  <td><code>search</code></td>
  <td><a href="#ItemSearchTraits"><code>ItemSearchTraits</code></b></td>
  <td></td>
  <td><p>Item search configuration</p>
</td>
</tr>

<tr><td colspan=4><b>ShadowTraits</b></td></tr>

<tr>
  <td><code>shadows</code></td>
  <td><code>string</code></td>
  <td><code>NONE</code></td>
  <td><p>Determines whether the tileset casts or receives shadows from each light source.</p>
</td>
</tr>

<tr>
  <td><code>showShadowUi</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Determines whether the shadow UI component will be shown on the workbench item</p>
</td>
</tr>

<tr><td colspan=4><b>TransformationTraits</b></td></tr>

<tr>
  <td><code>origin</code></td>
  <td><a href="#LatLonHeightTraits"><code>LatLonHeightTraits</code></b></td>
  <td></td>
  <td><p>The origin of the model, expressed as a longitude and latitude in degrees and a height in meters. If this property is specified, the model's axes will have X pointing East, Y pointing North, and Z pointing Up. If not specified, the model is located in the Earth-Centered Earth-Fixed frame.</p>
</td>
</tr>

<tr>
  <td><code>rotation</code></td>
  <td><a href="#HeadingPitchRollTraits"><code>HeadingPitchRollTraits</code></b></td>
  <td></td>
  <td><p>The rotation of the model expressed as heading, pitch and roll in the local frame of reference. Defaults to zero rotation.</p>
</td>
</tr>

<tr>
  <td><code>scale</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The scale factor to apply to the model</p>
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


## OptionsTraits

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
  <td><code>maximumScreenSpaceError</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The maximum screen space error used to drive level of detail refinement.</p>
</td>
</tr>

<tr>
  <td><code>maximumNumberOfLoadedTiles</code></td>
  <td><code>number</code></td>
  <td></td>
  <td></td>
</tr>

<tr>
  <td><code>pointCloudShading</code></td>
  <td><a href="#PointCloudShadingTraits"><code>PointCloudShadingTraits</code></b></td>
  <td></td>
  <td><p>Point cloud shading parameters</p>
</td>
</tr>
  </tbody>
</table>

### PointCloudShadingTraits

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
  <td><code>attenuation</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Perform point attenuation based on geometric error.</p>
</td>
</tr>

<tr>
  <td><code>geometricErrorScale</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Scale to be applied to each tile's geometric error.</p>
</td>
</tr>
  </tbody>
</table>


## FilterTraits

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
  <td><p>A name for the filter</p>
</td>
</tr>

<tr>
  <td><code>property</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name of the feature property to filter</p>
</td>
</tr>

<tr>
  <td><code>minimumValue</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Minimum value of the property</p>
</td>
</tr>

<tr>
  <td><code>maximumValue</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Minimum value of the property</p>
</td>
</tr>

<tr>
  <td><code>minimumShown</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The lowest value the property can have if it is to be shown</p>
</td>
</tr>

<tr>
  <td><code>maximumShown</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The largest value the property can have if it is to be shown</p>
</td>
</tr>
  </tbody>
</table>


## ClippingPlaneCollectionTraits

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
  <td><code>enabled</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Determines whether the clipping planes are active.</p>
</td>
</tr>

<tr>
  <td><code>unionClippingRegions</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>If true, a region will be clipped if it is on the outside of any plane in the collection. Otherwise, a region will only be clipped if it is on the outside of every plane.</p>
</td>
</tr>

<tr>
  <td><code>edgeWidth</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The width, in pixels, of the highlight applied to the edge along which an object is clipped.</p>
</td>
</tr>

<tr>
  <td><code>edgeColor</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The color applied to highlight the edge along which an object is clipped.</p>
</td>
</tr>

<tr>
  <td><code>planes</code></td>
  <td><a href="#ClippingPlaneDefinitionTraits"><code>ClippingPlaneDefinitionTraits[]</code></b></td>
  <td></td>
  <td><p>An array of ClippingPlane objects used to selectively disable rendering on the outside of each plane.</p>
</td>
</tr>

<tr>
  <td><code>modelMatrix</code></td>
  <td><code>number[]</code></td>
  <td></td>
  <td><p>The 4x4 transformation matrix specifying an additional transform relative to the clipping planes original coordinate system.</p>
</td>
</tr>
  </tbody>
</table>

### ClippingPlaneDefinitionTraits

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
  <td><code>distance</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>The shortest distance from the origin to the plane. The sign of distance determines which side of the plane the origin is on. If distance is positive, the origin is in the half-space in the direction of the normal; if negative, the origin is in the half-space opposite to the normal; if zero, the plane passes through the origin.</p>
</td>
</tr>

<tr>
  <td><code>normal</code></td>
  <td><code>number[]</code></td>
  <td></td>
  <td><p>The plane's normal (normalized).</p>
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


## EditorTraits

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
  <td><code>isEditable</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Indicates whether we can edit some aspect of the model item like its visibility or color</p>
</td>
</tr>

<tr>
  <td><code>isTransformable</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Indicates whether we can rotate/translate/scale the model</p>
</td>
</tr>
  </tbody>
</table>


## ItemSearchTraits

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
  <td><code>providerType</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The type of the search provider.</p>
</td>
</tr>

<tr>
  <td><code>providerOptions</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>Options for the search provider.</p>
</td>
</tr>

<tr>
  <td><code>resultTemplate</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>Template string to format the item result. You can pass a mustache template and refer to variables in {@ItemSearchResult.properties}. The template can also have HTML markup or markdown formatting.</p>
</td>
</tr>

<tr>
  <td><code>highlightColor</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A color to use for highlighting the selected result. Defaults to {@HighlightColorTraits.highlightColor} or {@Terria.baseMapContrastColor}</p>
</td>
</tr>

<tr>
  <td><code>parameters</code></td>
  <td><a href="#SearchParameterTraits"><code>SearchParameterTraits[]</code></b></td>
  <td></td>
  <td><p>Search parameter configurations</p>
</td>
</tr>
  </tbody>
</table>

### SearchParameterTraits

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
  <td><p>ID of the search parameter</p>
</td>
</tr>

<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A human readable name for the search parameter</p>
</td>
</tr>

<tr>
  <td><code>queryOptions</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>Options used when querying the parameter, these options will be passed to the index used for querying the parameter.</p>
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


## HeadingPitchRollTraits

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
  <td><code>heading</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Heading in degrees</p>
</td>
</tr>

<tr>
  <td><code>pitch</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Pitch in degrees</p>
</td>
</tr>

<tr>
  <td><code>roll</code></td>
  <td><code>number</code></td>
  <td></td>
  <td><p>Roll in degrees</p>
</td>
</tr>
  </tbody>
</table>