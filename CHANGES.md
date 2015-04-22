Change Log
==========

### 1.0.0

* Added support for region mapping based on region names instead of region numbers (example in `public/test/countries.csv`).
* Added support for time-dynamic region mapping (example in `public/test/droughts.csv`).
* Added the ability to specify CSV styling in the init file (example in `public/init/test.json`).
* Improved the appearance of the legends generated with region mapping.
* Added the ability to region-map countries (example in `public/test/countries.csv`).
* Elminated distracting "jumping" of the selection indicator when picking point features while zoomed in very close to the surface.
* Fixed a bug that caused features to be picked from all layers in an Esri MapServer, instead of just the visible ones.
* Added support for the WMS MinScaleDenominator property and the Esri MapServer maxScale property, preventing layers from disappearing when zoomed in to close to the surface.
* The 3D viewer now shows Bing Maps imagery unmodified, matching the 2D viewer.  Previously, it applied a gamma correction.
