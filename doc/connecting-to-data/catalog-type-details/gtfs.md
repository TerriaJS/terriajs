




## Properties

"type": "gtfs"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** |  | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
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
| show | **boolean** | true | Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel. |
| rectangle | **object** <br> see below | | The bounding box rectangle that contains all the data in this catalog item. |
| disablePreview | **boolean** | false | Disables the preview on the Add Data panel. This is useful when the preview will be very slow to load. |
| refreshInterval | **number** |  | How often the data in this model is refreshed, in seconds |
| refreshEnabled | **boolean** | true | Toggle for enabling auto refresh. |
| opacity | **number** | 0.8 | The opacity of the map layers. |
| keepOnTop | **boolean** | false | Keeps the layer on top of all other imagery layers. |
| featureInfoTemplate | **object** <br> see below | | A template object for formatting content in feature info panel |
| featureInfoUrlTemplate | **string** |  | A template URL string for fetching feature info. Template values of the form {x} will be replaced with corresponding property values from the picked feature. |
| showStringIfPropertyValueIsNull | **string** |  | If the value of a property is null or undefined, show the specified string as the value of the property. Otherwise, the property name will not be listed at all. |
| apiKey | **string** |  | The key that should be used when querying the GTFS API service |
| image | **string** |  | Url for the image to use to represent a vehicle. Recommended size 32x32 pixels. |
| scaleImageByDistance | **object** <br> see below | | Describes how marker images are scaled by distance from the viewer. |
| model | **object** <br> see below | | 3D model to use to represent a vehicle. |
 

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

### Feature info template
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | A mustache template string for formatting name |
| template | **string** |  | A Mustache template string for formatting description |
| partials | **** |  | An object, mapping partial names to a template string. Defines the partials used in Template. |

### Scale Image by Distance
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| near | **number** | 0 | The lower bound of the camera distance range. |
| nearValue | **number** | 1 | The scale value to use when the camera is at the `Near` distance (or closer). A value greater than 1.0 enlarges the image while a scale less than 1.0 shrinks it. |
| far | **number** | 1 | The upper bound of the camera distance range. |
| farValue | **number** | 1 | The scale value to use when the camera is at the `Far` distance (or farther). A value greater than 1.0 enlarges the image while a scale less than 1.0 shrinks it. |

### Model
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| origin | **object** | [object Object] | The origin of the model, expressed as a longitude and latitude in degrees and a height in meters. If this property is specified, the model's axes will have X pointing East, Y pointing North, and Z pointing Up. If not specified, the model is located in the Earth-Centered Earth-Fixed frame. |
| latitude | **number** |  | Latitude in degrees |
| longitude | **number** |  | Longitude in degrees |
| height | **number** |  | Height above ellipsoid in metres |
| rotation | **object** | [object Object] | The rotation of the model expressed as heading, pitch and roll in the local frame of reference. |
| heading | **number** |  | Heading in degrees |
| pitch | **number** |  | Pitch in degrees |
| roll | **number** |  | Roll in degrees |
| scale | **number** |  | The scale factor to apply to the model |
| shadows | **string** | NONE | Determines whether the tileset casts or receives shadows from each light source. |
| showShadowUi | **boolean** | true | Determines whether the shadow UI component will be shown on the workbench item |
| upAxis | **string** |  | The model's up-axis. By default models are y-up according to the glTF spec, however geo-referenced models will typically be z-up. Valid values are 'X', 'Y', or 'Z'. |
| forwardAxis | **string** |  | The model's forward axis. By default, glTF 2.0 models are Z-forward according to the glTF spec, however older glTF (1.0, 0.8) models used X-forward. Valid values are 'X' or 'Z'. |
| heightReference | **string** | NONE | Position relative to the ground. Accepted values are NONE, CLAMP_TO_GROUND & RELATIVE_TO_GROUND as described in the cesium doc - https://cesium.com/docs/cesiumjs-ref-doc/global.html#HeightReference |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** |  | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
| bearingDirectionProperty | **string** |  | Path to the bearing direction |
| compassDirectionProperty | **string** |  | Path to the compass direction |
| maximumDistance | **number** |  | The farthest distance from the camera that the model will still be drawn |
