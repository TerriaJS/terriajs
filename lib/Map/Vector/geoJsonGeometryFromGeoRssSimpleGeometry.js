var defined = require("terriajs-cesium/Source/Core/defined").default;
var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var i18next = require("i18next").default;

var featureCreators = {
  point: createPointGeometry,
  line: createLineGeometry,
  polygon: createPolygonGeometry,
  box: createGeometryFromBox
};
function geoJsonGeometryFromGeoRssSimpleGeometry(geometry) {
  var type = geometry.localName;
  var creator = featureCreators[type];
  if (!defined(creator)) {
    throw new RuntimeError(
      i18next.t("map.geoRssToGeoJson.containsUnsupportedFeatureType", {
        type: type
      })
    );
  }

  return creator(geometry);
}

function createPointGeometry(pointGeometry) {
  return {
    type: "Point",
    coordinates: geom2coord(pointGeometry.textContent.trim())[0]
  };
}
function createLineGeometry(lineGeometry) {
  return {
    type: "LineString",
    coordinates: geom2coord(lineGeometry.textContent)
  };
}

function createPolygonGeometry(polygonGeometry) {
  return {
    type: "Polygon",
    coordinates: [geom2coord(polygonGeometry.textContent.trim())]
  };
}

function createGeometryFromBox(bboxGeometry) {
  var coordinates = bboxGeometry.textContent
    .trim()
    .split(/\s+/)
    .filter(isNotEmpty);
  if (coordinates.length !== 4) {
    throw new RuntimeError("geometry not valid");
  }
  var minLat = coordinates[0];
  var minLon = coordinates[1];
  var maxLat = coordinates[2];
  var maxLon = coordinates[3];

  return {
    type: "Polygon",
    coordinates: [
      [
        [minLon, minLat],
        [minLon, maxLat],
        [maxLon, maxLat],
        [maxLon, minLat],
        [minLon, minLat]
      ]
    ]
  };
}

function isNotEmpty(s) {
  return s.length !== 0;
}

//Utility function to change esri gml positions to geojson positions
function geom2coord(posList) {
  var pnts = posList.split(/\s+/).filter(isNotEmpty);
  var coords = [];
  for (var i = 0; i < pnts.length; i += 2) {
    coords.push([parseFloat(pnts[i + 1]), parseFloat(pnts[i])]);
  }
  return coords;
}

module.exports = geoJsonGeometryFromGeoRssSimpleGeometry;
