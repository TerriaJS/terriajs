




## Properties

"type": "ckan-item"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** | 1d | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
| dataCustodian | **string** |  | Gets or sets a description of the custodian of this data item. |
| show | **boolean** | true | Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel. |
| rectangle | **object** <br> see below | | The bounding box rectangle that contains all the data in this catalog item. |
| disablePreview | **boolean** | false | Disables the preview on the Add Data panel. This is useful when the preview will be very slow to load. |
| itemProperties | **** |  | An object of properties that will be set on the item created from the CKAN resource. |
| useResourceName | **boolean** | false | True to use the name of the resource for the name of the catalog item; false to use the name of the dataset. |
| useDatasetNameAndFormatWhereMultipleResources | **boolean** | true | Use a combination of the name and the resource format and dataset where there are multiple resources for a single dataset. |
| useCombinationNameWhereMultipleResources | **boolean** | false | Use a combination of the name and the resource and dataset name where there are multiple resources for a single dataset. |
| supportedResourceFormats | **object[]** <br> see below | | The supported distribution formats and their mapping to Terria types. These are listed in order of preference. |
| name | **string** |  | The name to use for this catalog member before the reference is loaded. |
| isGroup | **boolean** |  | Is the target of this reference expected to be a catalog group? |
| isFunction | **boolean** |  | Is the target of this reference expected to be a catalog function? |
| isMappable | **boolean** |  | Is the target of this reference expected to have map items? |
| isChartable | **boolean** |  | Is the target of this reference expected to have chart items? |
| datasetId | **string** |  | The CKAN ID of the dataset. |
| resourceId | **string** |  | The Resource ID of the dataset to use |
 

### Rectangle
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| west | **number** |  | The westernmost longitude in degrees. |
| south | **number** |  | The southernmost longitude in degrees. |
| east | **number** |  | The easternmost longitude in degrees. |
| north | **number** |  | The northernmost longitude in degrees. |

### Supported Resource Formats
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| id | **string** |  | The ID of this distribution format. |
| formatRegex | **string** |  | A regular expression that is matched against the distribution's format. |
| definition | **** |  | The catalog member definition to use when the URL and Format regular expressions match. The `URL` property will also be set. |
