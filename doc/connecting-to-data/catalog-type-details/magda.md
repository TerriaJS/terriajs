
# MagdaReference



`"type": "magda"`

## MagdaReferenceTraits

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
  <td><code>recordId</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>The ID of the Magda record referred to by this reference.</p>
</td>
</tr>

<tr>
  <td><code>magdaRecord</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>The available representation of the Magda record as returned by the Magda registry API. This representation may not include all aspects and it may not be dereferenced.</p>
</td>
</tr>

<tr>
  <td><code>override</code></td>
  <td><code>any</code></td>
  <td></td>
  <td><p>The properties to apply to the dereferenced item, overriding properties that come from Magda itself.</p>
</td>
</tr>

<tr>
  <td><code>distributionFormats</code></td>
  <td><a href="#MagdaDistributionFormatTraits"><code>MagdaDistributionFormatTraits[]</code></b></td>
  <td></td>
  <td><p>The supported distribution formats and their mapping to Terria types. These are listed in order of preference.</p>
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
  <td><code>0d</code></td>
  <td><p>The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds).</p>
</td>
</tr>
  </tbody>
</table>

## MagdaDistributionFormatTraits

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
  <td><code>urlRegex</code></td>
  <td><code>string</code></td>
  <td></td>
  <td><p>A regular expression that is matched against the distribution's URL.</p>
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