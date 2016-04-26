#### Customizing Terria

These guides cover configuring, skinning and tweaking Terria. You'll need some basic sysadmin or development skills for most tasks. Some of these tricks you can use on any public Terria site.

First, read [Deployment](/Documentation/Deployment) to get up and running.

# Configuring

Location | Purpose
---------|---------
`wwwroot/config.json` | [Config.json](/Documentation/Customizing/Config-JSON.md): Client-side configuration. Configures catalog (init) files to load, attribution, keys for Bing Maps and Google Analytics, the name of your application.
`wwwroot/terria.json` | A sample [catalog (init) file](/Documentation/CatalogManagement/Initialization-File.md). You can add new datasets here.
`devserverconfig.json` | Server-side configuration for [Terria Server](https://github.com/TerriaJS/TerriaJS-Server). Configures which domains the server will proxy for, and special locations of init files.
`index.js`| The [index.js](https://github.com/TerriaJS/TerriaMap/blob/master/index.js) is an entry point for Terria Map. Some "configuration-like" aspects are controlled through JavaScript in this file, such as the choices of base map. We try to progressively move these into the above files.

* [How to skin a Terria Map](How-to-skin-a-Terria-Map.md)
* [TerriaJS URL parameters](TerriaJS-URL-parameters.md)
* [How to control TerriaJS through an `<iframe>`](TerriaJS-in-iframe.md)
* [Extending TerriaJS](Extending-TerriaJS.md): A guide for developers wanting to add new features such as new catalog item types, or otherwise modify Terria behaviour.
* [CKAN previewer](CKAN-previewer.md)

Other tools and info:

* [Make your own map without writing code](http://stevebennett.me/2015/07/02/your-own-personal-national-map-with-terriajs-no-coding-and-nothing-to-deploy/)
* [Manage a data catalogue](http://terriajs.github.io/DataSourceEditor).
* You can create a simple custom map by creating a spreadsheet with data and dragging it on to the NationalMap.  The spreadsheet must have a column with spatial information (eg a postcode or statistical region identifier) or columns for latitude and longitude.  See the [[CSV-geo-au]] guideline for more information about what spatial data is supported.  
