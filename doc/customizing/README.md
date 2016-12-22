These guides cover configuring, skinning, and tweaking TerriaJS. You'll need some basic sysadmin or development skills for most tasks. Some of these tricks you can use on any public Terria site.

First, read [Getting Started](../GettingStarted/README.md) to get up and running.

# Configuration Files

TerriaMap and TerriaJS use a number of configuration files to allow you to extensively customize the application, often without writing any code.  Click the locations in the table below for more information about each config file.

Location | Purpose
---------|---------
[wwwroot/config.json](Config-JSON.md) | Client-side configuration, such as: <ul><li>which catalog (init) files to load</li><li>branding at the top of the application</li><li>the application name and support email address</li><li>disclaimers</li><li>keys for Bing Maps and Google Analytics</li><li>...and more</li></ul>
[wwwroot/init/terria.json](../CatalogManagement/Initialization-File.md) | A sample catalog (init) file. You can add new datasets to your catalog here.
[devserverconfig.json](Server-Config.md) | Server-side configuration for [Terria Server](https://github.com/TerriaJS/TerriaJS-Server). Configures which domains the server will proxy for, and special locations of init files.
[lib/Styles/variables.scss](How-to-skin-a-Terria-Map.md#Variables) | Tweakable variables that influence the look and feel (CSS) of TerriaMap
[lib/Views/global.scss](How-to-skin-a-Terria-Map.md#Overrides) | CSS overrides for more extensive customization of the look and feel of TerriaMap

* [TerriaJS URL parameters](TerriaJS-URL-parameters.md)
* [TerriaJS WPS parameters](WPS-parameters-guide.md)
* [How to control TerriaJS through an `<iframe>`](TerriaJS-in-iframe.md)
* [Extending TerriaJS](Extending-TerriaJS.md): A guide for developers wanting to add new features such as new catalog item types, or otherwise modify Terria behaviour.
* [CKAN previewer](CKAN-previewer.md)

Other tools and info:

* [Make your own map without writing code](http://stevebennett.me/2015/07/02/your-own-personal-national-map-with-terriajs-no-coding-and-nothing-to-deploy/)
* [Manage a data catalogue](http://terriajs.github.io/DataSourceEditor).
* You can create a simple custom map by creating a spreadsheet with data and dragging it on to the NationalMap.  The spreadsheet must have a column with spatial information (eg a postcode or statistical region identifier) or columns for latitude and longitude.  See the [[CSV-geo-au]] guideline for more information about what spatial data is supported.
