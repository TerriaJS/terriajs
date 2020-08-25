


## Properties

"type": "senaps-locations"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| featureInfoTemplate | **object** <br> see below | | A template object for formatting content in feature info panel |
| featureInfoUrlTemplate | **string** |  | A template URL string for fetching feature info. Template values of the form {x} will be replaced with corresponding property values from the picked feature. |
| showStringIfPropertyValueIsNull | **string** |  | If the value of a property is null or undefined, show the specified string as the value of the property. Otherwise, the property name will not be listed at all. |
| splitDirection | **number** | 0 | The side of the splitter to display this imagery layer on. Defaults to both sides. |
| dataCustodian | **string** |  | Gets or sets a description of the custodian of this data item. |
| show | **boolean** | true | Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel. |
| rectangle | **object** <br> see below | | The bounding box rectangle that contains all the data in this catalog item. |
| disablePreview | **boolean** | false | Disables the preview on the Add Data panel. This is useful when the preview will be very slow to load. |
| refreshInterval | **number** |  | How often the data in this model is refreshed, in seconds |
| refreshEnabled | **boolean** |  | Toggle for enabling auto refresh. |
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
| locationIdFilter | **string** |  | 
    A string to filter locations using the id field, locations matching the filter will be included,
    multiple filters can be seperated using a comma, eg "*boorowa*,*environdata*"
     |
| streamIdFilter | **string** |  | 
    A string to filter streams using the id field, streams matching the filter will be included,
    multiple filters can be seperated using a comma, eg "*SHT31DIS_ALL*,*environdata*"
     |
| style | **object** <br> see below | | Styling rules that follow simplestyle-spec |
 

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

### Style
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| marker-size | **string** |  | Marker size. Valid values are `small`, `medium`, or `large`. If the value is a number, it is the size in pixels. |
| marker-color | **string** |  | Marker color |
| marker-symbol | **string** |  | Marker symbol. |
| marker-opacity | **number** |  | Marker opacity. |
| marker-url | **string** |  | Marker URL. |
| stroke | **string** |  | Stroke color. |
| stroke-opacity | **string** |  | Stroke opacity. |
| stroke-width | **number** |  | Stroke width. |
| fill | **string** |  | Fill color. |
| fill-opacity | **number** |  | Fill opacity. |
