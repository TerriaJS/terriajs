




## Properties

"type": "magda"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | The name to use for this catalog member before the reference is loaded. |
| isGroup | **boolean** |  | Is the target of this reference expected to be a catalog group? |
| isFunction | **boolean** |  | Is the target of this reference expected to be a catalog function? |
| isMappable | **boolean** |  | Is the target of this reference expected to have map items? |
| isChartable | **boolean** |  | Is the target of this reference expected to have chart items? |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** | 0d | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
| recordId | **string** |  | The ID of the Magda record referred to by this reference. |
| magdaRecord | **** |  | The available representation of the Magda record as returned by the Magda registry API. This representation may not include all aspects and it may not be dereferenced. |
| override | **** |  | The properties to apply to the dereferenced item, overriding properties that come from Magda itself. |
| distributionFormats | **object[]** <br> see below | | The supported distribution formats and their mapping to Terria types. These are listed in order of preference. |
 

### Distribution Formats
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| id | **string** |  | The ID of this distribution format. |
| formatRegex | **string** |  | A regular expression that is matched against the distribution's format. |
| urlRegex | **string** |  | A regular expression that is matched against the distribution's URL. |
| definition | **** |  | The catalog member definition to use when the URL and Format regular expressions match. The `URL` property will also be set. |
