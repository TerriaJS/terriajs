


## Properties

"type": "ckan-group"

| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| isOpen | **boolean** | false | True if this group is open and its contents are visible; otherwise, false. |
| members | **** |  | The members of this group. |
| url | **string** |  | The base URL of the file or service. |
| forceProxy | **boolean** | false | Force the proxy to be used for all network requests. |
| cacheDuration | **string** | 1d | The cache duration to use for proxied URLs for this catalog member. If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds). |
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
| itemProperties | **** |  | An object of properties that will be set on the item created from the CKAN resource. |
| useResourceName | **boolean** | false | True to use the name of the resource for the name of the catalog item; false to use the name of the dataset. |
| useDatasetNameAndFormatWhereMultipleResources | **boolean** | true | Use a combination of the name and the resource format and dataset where there are multiple resources for a single dataset. |
| useCombinationNameWhereMultipleResources | **boolean** | false | Use a combination of the name and the resource and dataset name where there are multiple resources for a single dataset. |
| supportedResourceFormats | **object[]** <br> see below | | The supported distribution formats and their mapping to Terria types. These are listed in order of preference. |
| blacklist | **string[]** |  | An array of strings of blacklisted group names and dataset titles.
      A group or dataset that appears in this list will not be shown to the user. |
| filterQuery | **** | [object Object] | Gets or sets the filter query to pass to CKAN when querying the available data sources and their groups. Each item in the
         * array causes an independent request to the CKAN, and the results are concatenated.  The
         * search string is equivalent to what would be in the parameters segment of the url calling the CKAN search api.
         * See the [Solr documentation](http://wiki.apache.org/solr/CommonQueryParameters#fq) for information about filter queries.
         * Each item is an object ({ fq: 'res_format:wms' }).
         *   To get all the datasets with wms resources: [{ fq: 'res_format%3awms' }]
         *   To get all wms/WMS datasets in the Surface Water group: [{q: 'groups=Surface Water', fq: 'res_format:WMS' }]
         *   To get both wms and esri-mapService datasets: [{q: 'res_format:WMS'}, {q: 'res_format:"Esri REST"' }]
         *   To get all datasets with no filter, you can use ['']
        |
| groupBy | **string** | organization | Gets or sets a value indicating how datasets should be grouped.  Valid values are:
     * none - Datasets are put in a flat list; they are not grouped at all.
     * group - Datasets are grouped according to their CKAN group.  Datasets that are not in any groups are put at the top level.
     * organization - Datasets are grouped by their CKAN organization.  Datasets that are not associated with an organization are put at the top level.
      |
| ungroupedTitle | **string** | No group | A title for the group holding all items that don't have a group in CKAN.
      If the value is a blank string or undefined, these items will be left at the top level, not grouped. |
 

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

### Supported Resource Formats
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| id | **string** |  | The ID of this distribution format. |
| formatRegex | **string** |  | A regular expression that is matched against the distribution's format. |
| definition | **** |  | The catalog member definition to use when the URL and Format regular expressions match. The `URL` property will also be set. |
