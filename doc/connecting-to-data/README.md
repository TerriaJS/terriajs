This section explains how to get your own catalogs and data into a TerriaJS application.

Before beginning, it is very important to understand [Cross-Origin Resource Sharing](cross-origin-resource-sharing.md). Web browsers impose restrictions on how we're allowed to access data across hosts (e.g. accessing data on `data.gov.au` from a web site running at `nationalmap.gov.au`). Understanding these issues will avoid a lot of frustration while trying to add your data to a TerriaJS application.

TerriaJS can interface with three broad types if data:

- [Catalog Group](../connecting-to-data/catalog-groups.md): A group (folder) of items. Different group types allow the contents to be manually specified or to be automatically determined by querying various types of server. TerriaJS can use many different types of servers to populate a group, including CKAN, CSW, WMS, and more. For example, if you define a catalog group that points at a Web Map Service (WMS) server, TerriaJS will query the WMS `GetCapabilities` when the group is opened and fill the group with all of the layers advertised by the WMS server.
- [Catalog Item](../connecting-to-data/catalog-items.md): Actual geospatial or chart data from a file or service, in various formats. TerriaJS supports WMS, KML, GeoJSON, ArcGIS MapServer, and many more files and services as catalog items.
- [Catalog Function](../connecting-to-data/catalog-functions.md): A parameterized service, such as a Web Processing Service (WPS). The user supplies the parameters and gets back some result.
- [Catalog Reference](../connecting-to-data/catalog-references.md): Resolves to a Catalog Group, Item or Function.
- [Catalog item search](item-search.md): A mechanism for searching inside catalog items.
