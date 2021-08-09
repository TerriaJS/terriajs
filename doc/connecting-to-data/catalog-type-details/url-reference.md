
# UrlReference



`"type": "url-reference"`

## UrlReferenceTraits

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
  <td><code>allowLoad</code></td>
  <td><code>boolean</code></td>
  <td><code>true</code></td>
  <td><p>Whether it's ok to attempt to load the URL and detect failures.</p>
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
  <td></td>
  <td><p>The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds).</p>
</td>
</tr>
  </tbody>
</table>