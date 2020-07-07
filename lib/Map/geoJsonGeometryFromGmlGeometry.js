var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var i18next = require("i18next").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var gmlNamespace = "http://www.opengis.net/gml";

function createLineStringFromGmlGeometry(geometry) {
  var coordinates = [];

  var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, "posList");
  for (var i = 0; i < posNodes.length; ++i) {
    var positions = gml2coord(posNodes[i].textContent.trim());
    for (var j = 0; j < positions.length; ++j) {
      coordinates.push(positions[j]);
    }
  }

  return {
    type: "LineString",
    coordinates: coordinates
  };
}

function createPointFromGmlGeometry(geometry) {
  var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, "pos");
  if (posNodes < 1) {
    throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingPos"));
  }

  return {
    type: "Point",
    coordinates: gml2coord(posNodes[0].textContent)[0]
  };
}

function createMultiLineStringFromGmlGeometry(geometry) {
  var curveMembers = geometry.getElementsByTagNameNS(gmlNamespace, "posList");
  var curves = [];
  for (var i = 0; i < curveMembers.length; ++i) {
    curves.push(gml2coord(curveMembers[i].textContent));
  }

  return {
    type: "MultiLineString",
    coordinates: curves
  };
}

function createMultiPolygonFromGmlGeomtry(geometry) {
  var coordinates = [];

  var polygons = geometry.getElementsByTagNameNS(gmlNamespace, "Polygon");
  for (var i = 0; i < polygons.length; ++i) {
    var polygon = polygons[i];
    var exteriorNodes = polygon.getElementsByTagNameNS(
      gmlNamespace,
      "exterior"
    );
    if (exteriorNodes.length < 1) {
      throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingExteriorRing"));
    }

    var polygonCoordinates = [];

    var exterior = exteriorNodes[0];
    var posListNodes = exterior.getElementsByTagNameNS(gmlNamespace, "posList");
    if (posListNodes.length < 1) {
      throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingPosList"));
    }

    polygonCoordinates.push(gml2coord(posListNodes[0].textContent));

    var interiors = polygon.getElementsByTagNameNS(gmlNamespace, "interior");
    for (var j = 0; j < interiors.length; ++j) {
      var interior = interiors[j];
      var interiorPosListNodes = interior.getElementsByTagNameNS(
        gmlNamespace,
        "posList"
      );
      if (interiorPosListNodes.length < 1) {
        continue;
      }

      polygonCoordinates.push(gml2coord(interiorPosListNodes[0].textContent));
    }

    coordinates.push(polygonCoordinates);
  }

  return {
    type: "MultiPolygon",
    coordinates: coordinates
  };
}

function createPolygonFromGmlGeometry(geometry) {
  var polygonCoordinates = [];

  var exteriorNodes = geometry.getElementsByTagNameNS(gmlNamespace, "exterior");
  if (exteriorNodes.length < 1) {
    throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingExteriorRing"));
  }
  var exterior = exteriorNodes[0];
  var posListNodes = exterior.getElementsByTagNameNS(gmlNamespace, "posList");
  if (posListNodes.length < 1) {
    throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingPosList"));
  }

  polygonCoordinates.push(gml2coord(posListNodes[0].textContent));

  var interiors = geometry.getElementsByTagNameNS(gmlNamespace, "interior");
  for (var j = 0; j < interiors.length; ++j) {
    var interior = interiors[j];
    var interiorPosListNodes = interior.getElementsByTagNameNS(
      gmlNamespace,
      "posList"
    );
    if (interiorPosListNodes.length < 1) {
      continue;
    }

    polygonCoordinates.push(gml2coord(interiorPosListNodes[0].textContent));
  }

  return {
    type: "Polygon",
    coordinates: polygonCoordinates
  };
}

function createMultiPointFromGmlGeometry(geometry) {
  var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, "pos");
  var coordinates = [];

  for (var i = 0; i < posNodes.length; ++i) {
    coordinates.push(gml2coord(posNodes[i].textContent)[0]);
  }

  return {
    type: "MultiPoint",
    coordinates: coordinates
  };
}

var featureCreators = {
  Curve: createLineStringFromGmlGeometry,
  LineString: createLineStringFromGmlGeometry,
  Point: createPointFromGmlGeometry,
  Polygon: createPolygonFromGmlGeometry,
  MultiCurve: createMultiLineStringFromGmlGeometry,
  MultiPoint: createMultiPointFromGmlGeometry,
  MultiSurface: createMultiPolygonFromGmlGeomtry,
  Surface: createPolygonFromGmlGeometry
};

function geoJsonGeometryFeatureFromGmlGeometry(geometry) {
  var type = geometry.localName;
  var creator = featureCreators[type];
  if (!defined(creator)) {
    throw new RuntimeError(
      i18next.t("map.gmlToGeoJson.containsUnsupportedFeatureType", {
        type: type
      })
    );
  }

  return creator(geometry);
}

function isNotEmpty(s) {
  return s.length !== 0;
}

//Utility function to change esri gml positions to geojson positions
function gml2coord(posList) {
  var pnts = posList.split(/[ ,]+/).filter(isNotEmpty);
  var coords = [];
  for (var i = 0; i < pnts.length; i += 2) {
    coords.push([parseFloat(pnts[i + 1]), parseFloat(pnts[i])]);
  }
  return coords;
}

module.exports = geoJsonGeometryFeatureFromGmlGeometry;
