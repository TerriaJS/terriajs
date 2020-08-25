




## Properties

"type": "esri-featureServer"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** | 1d | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
| dataCustodian | **string** |  | Gets or sets a description of the custodian of this data item. |
| show | **boolean** | true | Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel. |
| rectangle | **object** <br> see below | | The bounding box rectangle that contains all the data in this catalog item. |
| disablePreview | **boolean** | false | Disables the preview on the Add Data panel. This is useful when the preview will be very slow to load. |
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
| clampToGround | **boolean** | true | Whether the features in this service should be clamped to the terrain surface. |
| useStyleInformationFromService | **boolean** | true | Whether to symbolise the data using the drawingInfo object available in the service endpoint. |
| layerDef | **string** | 1=1 | The 'layerDef' string to pass to the server when requesting geometry. |
| legends | **object[]** <br> see below | | The legends to display on the workbench. |
 

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

### Legend URLs
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| title | **string** |  | A title to be displayed above the legend. |
| url | **string** |  | The URL of the legend image. |
| urlMimeType | **string** |  | The MIME type of the `URL` legend image. |
| items | **object[]** |  |  |
| title | **string** |  | The title to display next to this legend item. |
| titleAbove | **string** |  | The title to display above this legend item, i.e. marking the top of a box on the legend. |
| titleBelow | **string** |  | The title to display below this legend item, i.e. marking the bottom of a box on the legend. |
| color | **string** |  | The CSS color to display for this item. This property is ignored if `Legend URL` is specified. |
| outlineColor | **string** |  | The CSS color with which to outline this item. |
| multipleColors | **string[]** |  | Multiple colors to show with this item in a grid arrangement. |
| imageUrl | **string** |  | The URL of an image to display with this item. |
| addSpacingAbove | **boolean** |  | True to add a bit of extra spacing above this item in order to separate it visually from the rest of the legend. |
| imageHeight | **number** |  | The height of the legend image. |
| imageWidth | **number** |  | The width of the legend image. |
