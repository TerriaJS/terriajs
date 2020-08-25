




## Properties

"type": "url-reference"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | The name to use for this catalog member before the reference is loaded. |
| isGroup | **boolean** |  | Is the target of this reference expected to be a catalog group? |
| isFunction | **boolean** |  | Is the target of this reference expected to be a catalog function? |
| isMappable | **boolean** |  | Is the target of this reference expected to have map items? |
| isChartable | **boolean** |  | Is the target of this reference expected to have chart items? |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** |  | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
| allowLoad | **boolean** | true | Whether it's ok to attempt to load the URL and detect failures. |
 
