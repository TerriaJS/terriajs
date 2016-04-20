This guide is for data custodians providing data that will be shown on NationalMap.

* [Overview](#overview)
* [Paths to putting a data set on the NationalMap](#paths-to-putting-a-data-set-on-the-nationalmap)
* [Trying your data set in NationalMap](#trying-your-data-set-in-nationalmap)
  * [Web services](#web-services)
  * [Data files](#data-files)
  * [Content not supported by Add Data](#content-not-supported-by-add-data)
  * [Troubleshooting](#troubleshooting)
* [Cross-origin resource sharing (CORS)](#cross-origin-resource-sharing-cors)
* [Performance](#performance)
* [Adding a data set via Data.gov.au](#adding-a-data-set-via-datagovau)
* [Adding a data set to a state or territory group](#adding-a-data-set-to-a-state-or-territory-group)
  * [ACT Government](#act-government)
  * [New South Wales Government](#new-south-wales-government)
  * [Northern Territory Government](#northern-territory-government)
  * [Queensland Government](#queensland-government)
  * [South Australian Government](#south-australian-government)
  * [Tasmanian Government](#tasmanian-government)
  * [Victorian Government](#victorian-government)
  * [Western Australian Government](#western-australian-government)
* [Adding a data set to National Data Sets or elsewhere](#adding-a-data-set-to-national-data-sets-or-elsewhere)

## Overview

[TerriaJS](https://github.com/TerriaJS/terriajs), the software that drives NationalMap, can display data from a wide range of data sources. The key principles are:

* data is loaded directly from your data source into the user's web browser.  NationalMap does not host any data itself.
* metadata comes from your data source, but can be overridden in a data source configuration file.
* the better the metadata at your service end, the easier it is to display in NationalMap.

There are three main types:

* "web" services: 1 URL points to one data set served via a web service, such as WMS, WFS, ArcGIS MapServer, etc.
* "catalogue group" services: 1 URL points to a collection of data sets, such as through WMS GetCapabilities or CKAN.
* "file" services: 1 URL points to a file which is completely downloaded into the browser by HTTP and then displayed.

## Paths to putting a data set on the NationalMap

There are three main paths for getting a data set on to the NationalMap:

* Add the data set to [data.gov.au](http://data.gov.au), following conventions defined [below](#adding-a-data-set-via-datagovau).  Such data sets will appear on the NationalMap in the Data.gov.au section of the Data Catalogue.
* Follow a process specific to each state or territory, described [below](#adding-a-data-set-to-a-state-or-territory-group), to add the data set to a state or territory group in the Data Catalogue.
* Request that the data set be added somewhere else in the Data Catalogue, such as to the curated National Data Sets section or as a new top-level group, using the process described [below](#adding-a-data-set-to-national-data-sets-or-elsewhere).  The [Department of Communications](mailto:nationalmap@communications.gov.au) has final authority over the organization and contents of the Data Catalogue.

Whichever path you choose, the first step is try your data set in NationalMap and verify that it works well.  NationalMap makes it easy in most cases to try out new data sets without any involvement from the Department of Communications or the NationalMap administrators.

## Trying your data set in NationalMap

The easiest way to try a data set in NationalMap is via the "Add Data" feature.

![Add Data button](images/AddDataButton.png)

![Add Data button](images/AddDataPanel.png)

### Web services

The following types of web services are supported by entering a URL for the web service in the Add Data panel.  Click the name of a web service below, where available, for details about the features and limitations of NationalMap's support for each type of web service.

* [Web Map Service (WMS)](https://github.com/TerriaJS/terriajs/wiki/Web-Map-Service)
* Web Feature Service (WFS)
* Web Map Tile Service (WMTS)
* Esri ArcGIS Server
* OpenStreetMap-like Server

After you enter a URL and click the `Add` button, the web service will be added to the Data Catalogue under the _User-Added Data_ group.

![Added web service](images/AddedWebService.png)

You may then enable one or more data sets by checking the box next to it in the Data Catalogue.  A data set that works well in this way is straightforward to add to the official NationalMap data catalogue.

### Data files

In addition to web services, data sets can be added to NationalMap as individual files that are fully downloaded by the web browser and then displayed.  The following types of files are supported.  Click the name of a file type for details about the features and limitations of NationalMap's support for each.

* [Keyhole Markup Language (KML), including KMZ](http://www.opengeospatial.org/standards/kml/)
* [GeoJSON](https://github.com/TerriaJS/terriajs/wiki/GeoJSON)
* [Cesium Language (CZML)](https://github.com/AnalyticalGraphicsInc/cesium/wiki/CZML-Guide)
* [Comma-Separated Values (CSV)](https://github.com/NICTA/nationalmap/wiki/csv-geo-au)
* GPS Exchange Format (GPX)
* [Others](https://github.com/TerriaJS/terriajs/wiki/Format-Conversion-Service) such as Esri Shapefiles

A data file can be tested in NationalMap by:

* hosting it on a web server and entering its URL in the Add Data panel.
* clicking the _Browse to select a local data file to upload_ link on the Add Data panel and selecting the file from your local system.
* Dragging the file from your local system onto the map.

Please note that only the first option will work in Internet Explorer 9.  Internet Explorer 10+ and any recent version of Chrome, Firefox, or Safari will support all three options.

Because these kinds of data files must be loaded completely before they can be shown on the map, it is important that their size be reasonable.  We recommend that single-file data sets be less than a couple of megabytes in size.  If you normally use the 3D viewer (the default on systems that support it), we recommend you try your data set in the 2D view as well, because it is often slower with large data sets.

For data sets that are too large or slow as single files, consider hosting them using a WMS server.  Data.gov.au can do this for you [very easily](#adding-a-data-set-via-datagovau).

### Content not supported by Add Data

NationalMap supports some additional data set types that cannot be added with _Add Data_.  If you have data in one of these formats, you will need to write a [TerriaJS Catalog File](https://github.com/TerriaJS/terriajs/wiki/Catalog-File) to try the data set in NationalMap.

* [CKAN](https://github.com/TerriaJS/terriajs/wiki/CKAN)
* OGC Catalogue Service (CSW)
* Socrata
* Bing Maps-like Server

### Troubleshooting

Experiencing difficulty adding your data set to NationalMap?  The first thing to try is opening your web browser's debug console.  You can access it as follows:

* Google Chrome - Hamburger menu in the top right, More tools, JavaScript console
* Mozilla Firefox - Hamburger menu in the top right, Developer, Web console
* Internet Explorer 11 - Gear button in the top right, F12 Developer Tools, Console (at the top of the developer tools window that appears)

Then, reload the page and try adding your data set again.  A message in the console may give you a hint about what is going wrong.  It may also be helpful to use your web browser's Network debugging tools to inspect the requests that NationalMap is making to your server and the responses that it is getting back.

By far the most common problem when attempting to add data to NationalMap is a CORS failure.  See [below](#cross-origin-resource-sharing-cors) for information about CORS.

If you're stuck, contact nationalmap@communications.gov.au for assistance.

## Cross-origin resource sharing (CORS)

NationalMap is a web application, so it must play by the rules of the web.  One of those rules is the restrictions that web browsers place on sharing content across origins.  For example, in the absence of special configuration, a web application running on one domain, such as `nationalmap.gov.au`, is not permitted to access resources hosted on another domain, such as `data.gov.au`.  NationalMap will display an error when attempting to access such a resource, and your web browser's console will display a message indicating a Cross-Origin Resource Sharing failure.

The "special configuration" mentioned above is a change to the HTTP headers returned by the server hosting the data set.  The server should include this HTTP header, which gives web applications running on other domains permission to use the resource:

```
Access-Control-Allow-Origin: *
```

Instructions for configuring a large variety of web servers to include this header can be found at [enable-cors.org](http://enable-cors.org/).

Including this header in the response is safe and desirable for all requests for public resources.  You can learn more about CORS from the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS).

If you are, for some reason, unable to enable CORS access to your data set, it is possible to use the NationalMap proxy to bypass web browser CORS restrictions.  The way it works is that the web browser (client) makes a request to NationalMap's proxy service, which runs on the same domain as NationalMap itself, and then the NationalMap server makes a request to your data set's server on the client's behalf.  This process will happen automatically and transparently when your server is on the "whitelist" of servers that the NationalMap proxy is willing to proxy for.  `*.gov.au` is already on the list.  If you need to add another server to the list, please contact nationalmap@communications.gov.au.

## Performance

You should test the performance of your datasets in NationalMap.  You can do this by running the NationalMap [performance testing tool] (https://github.com/TerriaJS/terriajs/wiki/Performance-testing). 

To improve performance of your data services, consider using cacheing which may be provided as part of a GIS software package or may be provided by separate software or cloud services.

## Adding a data set via Data.gov.au

NationalMap automatically discovers resources with compatible formats on [data.gov.au](http://data.gov.au/) and adds them to the `Data.gov.au` group in the Data Catalogue.

It may take up to 24 hours for a new data set added to [data.gov.au](http://data.gov.au/) to appear in NationalMap.

We recommend that you only add one NationalMap compatible resource to each data.gov.au data set.  The name of the catalogue item in NationalMap is derived from the name of the data.gov.au data set, so multiple resources will work, but will appear in the catalogue with the same name.

[data.gov.au](http://data.gov.au/) automatically turns some types of data into WMS services on a nightly basis.

For more information about adding datasets to [data.gov.au](http://data.gov.au/), see the Australian Government's [Open Data Toolkit](https://toolkit.data.gov.au/index.php?title=How_to_use_data.gov.au),

The following sections contain instructions for adding entries for specific data types in [data.gov.au](http://data.gov.au/).

### Web Map Service (WMS)

`Format=WMS`

The URL should be set to either the base URL of the WMS server (e.g. `http://data.gov.au/geoserver/ballarat-parking-machines/wms`) or to a valid `GetCapabilities` or `GetMap` URL for the server (e.g. `http://data.gov.au/geoserver/ballarat-parking-machines/wms?service=WMS&request=GetCapabilities`).

If the URL includes a `LAYERS` or `layers` parameter (as a `GetMap` request typically does), NationalMap will add the resource to the catalogue as a WMS data set, using the layers specified in the parameter.

The resource may instead specify a `wms_layer` property, and NationalMap will use that layer (or those layers) instead.

If the `wms_layer` property does not exist, and the layer cannot be deduced from the URL, the resource will not appear in the catalogue at all.

### Geospatial CSV files

`Format=csv-geo-au`

The URL should be a link to the actual CSV file.  Any resource with this format will appear in the NationalMap catalogue.  Please ensure that that CSV file conforms to the [csv-geo-au](https://github.com/NICTA/nationalmap/wiki/csv-geo-au) standard.

## Adding a data set to a state or territory group

The following describe how the state and territory groups in the Data Catalogue are populated.  In many cases, it is possible to add or change data sets at the state level without any Department Of Communications involvement, for example by adding a new data set to the state's CKAN server.  To request changes to how a state or territory group is populated overall, please contact nationalmap@communications.gov.au.

Please also remember that it can take up to 24 hours for a new data set added to a state data server to appear in NationalMap.

### ACT Government

The ACT Government group is populated automatically by querying the [data.act.gov.au](http://www.data.act.gov.au) Socrata server.  Currently, only Web Map Service (WMS) servers are discovered and included in the Data Catalogue.

### New South Wales Government

The New South Wales Government section provides access to a number of ArcGIS MapServers hosted by the NSW [Spatial Information Exchange (SIX)](http://maps.six.nsw.gov.au).

### Northern Territory Government

The Northern Territory section provides access to WMS services provided by the [Northern Territory Land Information Systems](http://www.lands.nt.gov.au/land-info/ntlis).

### Queensland Government

The Queensland section provides access to several ESRI map servers operated by the Queensland Government.

### South Australian Government

The South Australian section is populated automatically by querying the CKAN server at [data.sa](http://data.sa.gov.au/).  Currently only Geojson and CSV-geo-au files are discovered and included in the Data Catalogue. 

### Tasmanian Government

The Tasmanian section provides access to several ESRI ARCGIS servers operated by the Tasmanian Government.

### Victorian Government

The Victorian section is populated automatically by querying the CKAN server at [data.vic.gov.au](http://data.vic.gov.au/).  Currently only WMS services are discovered and included in the Data Catalogue. 

### Western Australian Government

The West Australian section provides access to servers that are part of [SLIP](http://slip.landgate.wa.gov.au/) operated by Landgate in Western Australia.

## Adding a data set to National Data Sets or elsewhere

The Department of Communications maintains editorial control over the overall structure of the Data Catalogue, including the curated National Data Sets.  If you would like to add your data set to National Data Sets or elsewhere, please ensure that the data set works well in NationalMap by testing it as described above, and then contact nationalmap@communications.gov.au with your proposal.