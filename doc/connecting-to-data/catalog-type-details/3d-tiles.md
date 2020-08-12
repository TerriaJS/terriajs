
This is a description of the 3D Tiles Catalog Item

## Example usage
````json
{
  "type": "3d-tiles",
  "ionAssetId": "1234",
  "name": "My 3D-Tiles dataset"
}
````

## Properties

"type": "3d-tiles"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| editing | **object** - see below | | Editor traits - see below |
| origin | **object** - see below | | The origin of the model, expressed as a longitude and latitude in degrees and a height in meters. If this property is specified, the model's axes will have X pointing East, Y pointing North, and Z pointing Up. If not specified, the model is located in the Earth-Centered Earth-Fixed frame. - see below |
| rotation | **object** - see below | | The rotation of the model expressed as heading, pitch and roll in the local frame of reference. - see below |
| scale | **number** |  | The scale factor to apply to the model |
| featureInfoTemplate | **object** - see below | | A template object for formatting content in feature info panel - see below |
| featureInfoUrlTemplate | **string** |  | A template URL string for fetching feature info. Template values of the form {x} will be replaced with corresponding property values from the picked feature. |
| showStringIfPropertyValueIsNull | **string** |  | If the value of a property is null or undefined, show the specified string as the value of the property. Otherwise, the property name will not be listed at all. |
| show | **boolean** | true | Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel. |
| rectangle | **object** - see below | | The bounding box rectangle that contains all the data in this catalog item. - see below |
| disablePreview | **boolean** | false | Disables the preview on the Add Data panel. This is useful when the preview will be very slow to load. |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** |  | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
| name | **string** |  | The name of the catalog item. |
| description | **string** |  | The description of the catalog item. Markdown and HTML may be used. |
| nameInCatalog | **string** |  | The name of the item to be displayed in the catalog, if it is different from the one to display in the workbench. |
| info | **object[]** - see below | | Human-readable information about this dataset. - see below |
| infoSectionOrder | **string[]** | ,,,,,,,,,,,, | An array of section titles definining the display order of info sections. If this property is not defined, {@link DataPreviewSections}'s DEFAULT_SECTION_ORDER is used |
| isOpenInWorkbench | **boolean** | true | Whether the item in the workbench open or collapsed. |
| shortReport | **string** |  | A short report to show on the now viewing tab. |
| shortReportSections | **object[]** - see below | | A list of collapsible sections of the short report - see below |
| isExperiencingIssues | **boolean** | false | Whether the catalog item is experiencing issues which may cause its data to be unavailable |
| hideLegendInWorkbench | **boolean** | false | Whether the legend is hidden in the workbench for this catalog member. |
| hideSource | **boolean** | false | Indicates that the source of this data should be hidden from the UI (obviously this isn't super-secure as you can just look at the network requests). |
| shadows | **string** | NONE | Determines whether the tileset casts or receives shadows from each light source. |
| showShadowUi | **boolean** | true | Determines whether the shadow UI component will be shown on the workbench item |
| ionAssetId | **number** |  | The Cesium Ion asset id. |
| ionAccessToken | **string** |  | Cesium Ion access token id. |
| ionServer | **string** |  | URL of the Cesium Ion API server. |
| options | **object** - see below | | Additional options to pass to Cesium's Cesium3DTileset constructor. - see below |
| style | **** |  | The style to use, specified according to the [Cesium 3D Tiles Styling Language](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling). |
| filters | **object[]** - see below | | The filters to apply to this catalog item. - see below |
| colorBlendMode | **string** | MIX | The color blend mode decides how per-feature color is blended with color defined in the tileset. Acceptable values are HIGHLIGHT, MIX & REPLACE as defined in the cesium documentation - https://cesium.com/docs/cesiumjs-ref-doc/Cesium3DTileColorBlendMode.html |
| colorBlendAmount | **number** | 0.5 | When the colorBlendMode is MIX this value is used to interpolate between source color and feature color. A value of 0.0 results in the source color while a value of 1.0 results in the feature color, with any value in-between resulting in a mix of the source color and feature color. |
| highlightColor | **string** |  | The color used to highlight a feature when it is picked. If not set, this defaults to `Terria.baseMapContrastColor` |
| featureIdProperties | **string[]** |  | One or many properties of a feature that together identify it uniquely. This is useful for setting properties for individual features. eg: ['lat', 'lon'], ['buildingId'] etc. |
 

### Editor traits
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| isEditable | **boolean** | false | Indicates whether we can edit some aspect of the model item like its visibility or color |
| isTransformable | **boolean** | false | Indicates whether we can rotate/translate/scale the model |

### Origin
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| latitude | **number** |  | Latitude in degrees |
| longitude | **number** |  | Longitude in degrees |
| height | **number** |  | Height above ellipsoid in metres |

### Rotation
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| heading | **number** |  | Heading in degrees |
| pitch | **number** |  | Pitch in degrees |
| roll | **number** |  | Roll in degrees |

### Feature info template
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | A mustache template string for formatting name |
| template | **string** |  | A Mustache template string for formatting description |
| partials | **** |  | An object, mapping partial names to a template string. Defines the partials used in Template. |

### Rectangle
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| west | **number** |  | The westernmost longitude in degrees. |
| south | **number** |  | The southernmost longitude in degrees. |
| east | **number** |  | The easternmost longitude in degrees. |
| north | **number** |  | The northernmost longitude in degrees. |

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

### options
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| maximumScreenSpaceError | **number** |  | The maximum screen space error used to drive level of detail refinement. |
| maximumNumberOfLoadedTiles | **number** |  |  |
| pointCloudShading | **object** | [object Object] | Point cloud shading parameters |
| attenuation | **boolean** |  | Perform point attenuation based on geometric error. |
| geometricErrorScale | **number** |  | Scale to be applied to each tile's geometric error. |

### filters
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| name | **string** |  | A name for the filter |
| property | **string** |  | The name of the feature property to filter |
| minimumValue | **number** |  | Minimum value of the property |
| maximumValue | **number** |  | Minimum value of the property |
| minimumShown | **number** |  | The lowest value the property can have if it is to be shown |
| maximumShown | **number** |  | The largest value the property can have if it is to be shown |
