Change Log
==========

### 2015-03-26

* Greatly enhanced support for ArcGIS servers.  ArcGIS map servers can now be queried for their list of layers to populate the Data Catalogue, and they can provide metadata information when clicking a feature on the map.
* Added features to the Tools panel (accessible by visiting http://nationalmap.nicta.com.au/#tools=1) to test datasets.
* Added the "Broadband ADSL Availability" and "Broadband ADSL Availability no Borders" datasets to the catalogue under Communications.  Also fixed a typo in the name of "Broadband Availability no Borders".
* Improved styling of feature information popup in 2D viewer.
* Fixed a bug that prevented KMZ files from loading.
* Pressing Reset View now zooms back to see all of Australia even when the application is launched with a share link with another view.
* Fixed a bug that caused the view to be tilted slightly away from North after clicking the Reset View button.
* Made the 2D and 3D viewers use the exact same tile URLs, to improve caching.
* Many styling improvements / refinements.
* Fixed a bug that could cause very high memory usage when accessing a WMS server with very long strings in its metadata.
* Made National Map work even when it is not hosted at the root of the web server.

### 2015-03-03

* Add a prototype of loading KML files from data.gov.au, accessible at http://nationalmap.nicta.com.au/#dgakml.
* Improve the accuracy of picking features from WMS layers in the 3D view.
* Support picking of vector features (from GeoJSON, KML, CZML, etc.) in the 2D view even when a raster dataset (WMS, etc.) is also visible.
* Fix a bug that prevented most of the base maps from working in the 2D view.
* Fix a bug that sometimes caused high CPU usage in the 3D view.
* Dataset descriptions may now include embedded images using Markdown syntax.
* Ensure the 3D globe repaints when finished loading datasets from some sources, such GeoJSON, CZML, and WFS.
* Add support for displaying feature information from WFS and WMS servers that support GML but not GeoJSON.
* Fix a bug preventing vector polygons from GeoJSON, CZML, etc. from appearing in the 2D view.
* Fix a bug that prevented time-varying polylines from updating in the 2D view after they were initially displayed.

### 2015-02-17

#### New features, major improvements, and Catalogue changes:
* Promote data.gov.au to a top-level group and organize its datasets by Organization.
* Add the new GA topographic basemap as an option to the Maps panel.
* Add Tasmanian Government as a top-level group.
* Add a Tools panel, accessible from the menu bar when visiting http://nationalmap.nicta.com.au/#tools=1.  These tools aren't intended for use by end users.
* Fix the Population Estimates dataset.  We were pointing to a server that had been retired.
* Hide the following datasets in the "Water (Bureau of Meteorology Geofabric)" group due to poor performance: Groundwater Cartography 2.1, Surface Cartography, Surface Network 2.1.
* Add Mobile Black Spot dataset.

#### Bug fixes:
* Fix a bug where Cesium would sometimes not update when zooming in using two-finger scrolling on a touchpad.
* Fix a bug where Cesium would sometimes not update when using animation/timeline controls.
* Fix a hang when shift-drag zooming and releasing shift before releasing the mouse button.
* Fix a bug that prevented CSVs from being added to the map by URL.  Drag/drop and file selection worked fine.
* Make a region-mapped CSVs file a reorderable layer in the Now Viewing panel.
* Fix a bug that caused region-mapped layers to disappear when switching from 3D to 2D.

#### Minor changes / tweaks:
* Improve performance of the Broadband layers by leveraging the GeoWebCache and avoiding requests for non-cacheable tiles outside the region covered by the data.
* Remove the drop shadow around the compass to match the flat appearance of the rest of the UI.
* Make logos in the top-left ("brand bar") clickable.
* Re-add placeholder text ("Search address, landmark, or data set") to the Search tab input box.
* Make previously invalid URLs like http://nationalmap.nicta.com.au/#vic/ work
* Improve performance (especially in Safari) by only updating the distance / scale legend once every 250ms rather than continuously.
* Automatically switch to 2D, without losing any data, in the event of an unexpected error during 3D rendering.
* If not specified in the catalogue file, the spatial extent of a WMS layer is now automatically determined from the server's GetCapabilities.
* Update to Cesium 1.6 (changelog: https://github.com/AnalyticalGraphicsInc/cesium/blob/1.6/CHANGES.md )
* Access data.gov.au and ga.gov.au via the caching proxy for better performance.
* Improve the computation of the visible extent in 3D view, making the view stay more consistent when switching between 2D and 3D view.
* Improve the accuracy of the shared 3D view by adding precise camera parameters to the URL.
* Improve the performance of rendering point features, especially in 2D.
