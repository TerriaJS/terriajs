
# CkanItemReference




`"type": "ckan-item"`


## CkanCatalogItemTraits

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
  <td><code>datasetId</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The CKAN ID of the dataset.</p>
</td>
</tr>

<tr>
  <td><code>resourceId</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The Resource ID of the dataset to use</p>
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
  <td></td>
  <td><p>Toggle for enabling auto refresh.</p>
</td>
</tr>

<tr><td colspan=4><b>CatalogMemberReferenceTraits</b></td></tr>

<tr>
  <td><code>name</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The name to use for this catalog member before the reference is loaded.</p>
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
  <td><code>isGroup</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Is the target of this reference expected to be a catalog group?</p>
</td>
</tr>

<tr>
  <td><code>isFunction</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Is the target of this reference expected to be a catalog function?</p>
</td>
</tr>

<tr>
  <td><code>isMappable</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Is the target of this reference expected to have map items?</p>
</td>
</tr>

<tr>
  <td><code>isChartable</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Is the target of this reference expected to have chart items?</p>
</td>
</tr>

<tr><td colspan=4><b>CkanSharedTraits</b></td></tr>

<tr>
  <td><code>itemProperties</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>An object of properties that will be set on the item created from the CKAN resource.</p>
</td>
</tr>

<tr>
  <td><code>useResourceName</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>True to use the name of the resource for the name of the catalog item; false to use the name of the dataset.</p>
</td>
</tr>

<tr>
  <td><code>useDatasetNameAndFormatWhereMultipleResources</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Use a combination of the name and the resource format and dataset where there are multiple resources for a single dataset.</p>
</td>
</tr>

<tr>
  <td><code>useCombinationNameWhereMultipleResources</code></td>
  <td><code>boolean</code></td>
  <td></td>
  <td><p>Use a combination of the name and the resource and dataset name where there are multiple resources for a single dataset.</p>
</td>
</tr>

<tr>
  <td><code>supportedResourceFormats</code></td>
  <td><a href="#CkanResourceFormatTraits"><code>CkanResourceFormatTraits[]</code></b></td>
  <td></td>
  <td><p>The supported distribution formats and their mapping to Terria types. These are listed in order of preference.</p>
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


## CkanResourceFormatTraits

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
  <td><p>The ID of this distribution format.</p>
</td>
</tr>

<tr>
  <td><code>formatRegex</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A regular expression that is matched against the distribution's format.</p>
</td>
</tr>

<tr>
  <td><code>definition</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>The catalog member definition to use when the URL and Format regular expressions match. The <code>URL</code> property will also be set.</p>
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