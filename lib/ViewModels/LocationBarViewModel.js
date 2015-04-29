'use strict';

/*global require*/
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var CesiumTerrainProvider = require('terriajs-cesium/Source/Core/CesiumTerrainProvider');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Intersections2D = require('terriajs-cesium/Source/Core/Intersections2D');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var loadView = require('../Core/loadView');

var LocationBarViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }
    if (!defined(options.mapElement)) {
        throw new DeveloperError('options.mapElement is required.');
    }

     this.terria = options.terria;
    this.mapElement = options.mapElement;

    this.latitude = '43.199°S';
    this.longitude = '154.461°E';
    this.elevation = '28m';

    knockout.track(this, ['latitude', 'longitude', 'elevation']);

    var that = this;
    this.mapElement.addEventListener('mousemove', function(e) {
        var rect = that.mapElement.getBoundingClientRect();
        var position = new Cartesian2(e.clientX - rect.left, e.clientY - rect.top);

        if (defined( that.terria.cesium)) {
            updateCoordinatesFromCesium(that, position);
        } else if (defined( that.terria.leaflet)) {
            updateCoordinatesFromLeaflet(that, position);
        }
    }, false);
};

LocationBarViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/LocationBar.html', 'utf8'), container, this);
};

LocationBarViewModel.create = function(options) {
    var result = new LocationBarViewModel(options);
    result.show(options.container);
    return result;
};

function updateCoordinatesFromCesium(viewModel, position) {
    var scene = viewModel.terria.cesium.scene;

    var camera = scene.camera;
    var pickRay = camera.getPickRay(position);

    var globe = scene.globe;
    var pickedTriangle = globe.pickTriangle(pickRay, scene);
    if (defined(pickedTriangle)) {
        // Get a fast, accurate-ish height every time the mouse moves.
        var ellipsoid = globe.ellipsoid;

        var v0 = ellipsoid.cartesianToCartographic(pickedTriangle.v0);
        var v1 = ellipsoid.cartesianToCartographic(pickedTriangle.v1);
        var v2 = ellipsoid.cartesianToCartographic(pickedTriangle.v2);
        var intersection = ellipsoid.cartesianToCartographic(pickedTriangle.intersection);

        var barycentric = Intersections2D.computeBarycentricCoordinates(
            intersection.longitude, intersection.latitude,
            v0.longitude, v0.latitude,
            v1.longitude, v1.latitude,
            v2.longitude, v2.latitude);

        if (barycentric.x >= -1e-15 && barycentric.y >= -1e-15 && barycentric.z >= -1e-15) {
            var height = barycentric.x * v0.height +
                         barycentric.y * v1.height +
                         barycentric.z * v2.height;
            intersection.height = height;
        }

        var errorBar = globe.terrainProvider.getLevelMaximumGeometricError(pickedTriangle.tile.level);
        var approximateHeight = intersection.height;
        var minHeight = pickedTriangle.tile.data.minimumHeight;
        var maxHeight = pickedTriangle.tile.data.maximumHeight;
        var maxDiff = Math.max(approximateHeight - minHeight, maxHeight - approximateHeight);
        errorBar = Math.min(errorBar, maxDiff);

        cartographicToFields(viewModel, intersection, errorBar);

        debounceSampleAccurateHeight(viewModel, globe, intersection);
    } else {
        viewModel.latitude = undefined;
        viewModel.longitude = undefined;
        viewModel.elevation = undefined;
    }
}

function updateCoordinatesFromLeaflet(viewModel, position) {
    // TODO: correctly calculate these for Leaflet.
    viewModel.latitude = undefined;
    viewModel.longitude = undefined;
    viewModel.elevation = undefined;
}

function cartographicToFields(viewModel, coordinates, errorBar) {
    viewModel.latitude = Math.abs(CesiumMath.toDegrees(coordinates.latitude)).toFixed(3) + '°' + (coordinates.latitude < 0.0 ? 'S' : 'N');
    viewModel.longitude = Math.abs(CesiumMath.toDegrees(coordinates.longitude)).toFixed(3) + '°' + (coordinates.longitude < 0.0 ? 'W' : 'E');
    viewModel.elevation = Math.round(coordinates.height) + (defined(errorBar) ? '±' + Math.round(errorBar) : '') + 'm';
}

var lastHeightSamplePosition = new Cartographic();
var accurateHeightTimer;
var tileRequestInFlight;
var accurateSamplingDebounceTime = 250;

function debounceSampleAccurateHeight(viewModel, globe, position) {
    // After a delay with no mouse movement, get a more accurate height.
    Cartographic.clone(position, lastHeightSamplePosition);

    var terrainProvider = globe.terrainProvider;
    if (terrainProvider instanceof CesiumTerrainProvider) {
        clearTimeout(accurateHeightTimer);
        accurateHeightTimer = setTimeout(function() {
            sampleAccurateHeight(viewModel, terrainProvider, position);
        }, accurateSamplingDebounceTime);
    }
}

function sampleAccurateHeight(viewModel, terrainProvider, position) {
    accurateHeightTimer = undefined;
    if (tileRequestInFlight) {
        // A tile request is already in flight, so reschedule for later.
        accurateHeightTimer = setTimeout(function() {
            sampleAccurateHeight(viewModel, terrainProvider, position);
        }, accurateSamplingDebounceTime);
        return;
    }

    // Find the most detailed available tile at the last mouse position.
    var tilingScheme = terrainProvider.tilingScheme;
    var tiles = terrainProvider._availableTiles;
    var foundTileID;
    var foundLevel;

    for (var level = tiles.length - 1; !foundTileID && level >= 0; --level) {
        var levelTiles = tiles[level];
        var tileID = tilingScheme.positionToTileXY(position, level);
        var yTiles = tilingScheme.getNumberOfYTilesAtLevel(level);
        var tmsY = yTiles - tileID.y - 1;

        // Is this tile ID available from the terrain provider?
        for (var i = 0, len = levelTiles.length; !foundTileID && i < len; ++i) {
            var range = levelTiles[i];
            if (tileID.x >= range.startX && tileID.x <= range.endX && tmsY >= range.startY && tmsY <= range.endY) {
                foundLevel = level;
                foundTileID = tileID;
            }
        }
    }

    if (foundTileID) {
        // This tile has our most accurate available height, so go get it.
        tileRequestInFlight = when(terrainProvider.requestTileGeometry(foundTileID.x, foundTileID.y, foundLevel, false), function(terrainData) {
            tileRequestInFlight = undefined;
            if (Cartographic.equals(position, lastHeightSamplePosition)) {
                position.height = terrainData.interpolateHeight(tilingScheme.tileXYToRectangle(foundTileID.x, foundTileID.y, foundLevel), position.longitude, position.latitude);
                cartographicToFields(viewModel, position);
            } else {
                // Mouse moved since we started this request, so the result isn't useful.  Try again next time.
            }
        }, function() {
            tileRequestInFlight = undefined;
        });
    }
}

module.exports = LocationBarViewModel;
