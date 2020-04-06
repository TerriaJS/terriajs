"use strict";

/*global require*/
var computeRingWindingOrder = require("../Map/computeRingWindingOrder");
var defined = require("terriajs-cesium/Source/Core/defined").default;
var pointInPolygon = require("point-in-polygon");
var Point = require("@mapbox/point-geometry");
var WindingOrder = require("terriajs-cesium/Source/Core/WindingOrder").default;

/**
 * Converts feature data, such as from a WMS GetFeatureInfo or an Esri Identify, to
 * GeoJSON.  The set of feature data formats supported by this function can be extended
 * by adding to {@link featureDataToGeoJson#supportedFormats}.
 *
 * @param {Object} featureData The feature data to convert to GeoJSON.
 * @return {Object} The GeoJSON representation of this feature data, or undefined if it cannot be converted to GeoJSON.
 */
function featureDataToGeoJson(featureData) {
  if (!defined(featureData)) {
    return undefined;
  }

  for (var i = 0; i < featureDataToGeoJson.supportedFormats.length; ++i) {
    var converted = featureDataToGeoJson.supportedFormats[i].converter(
      featureData
    );
    if (defined(converted)) {
      return converted;
    }
  }
  return undefined;
}

featureDataToGeoJson.supportedFormats = [
  {
    name: "GeoJSON",
    converter: convertGeoJson
  },
  {
    name: "Esri",
    converter: convertEsri
  }
];

function convertGeoJson(featureData) {
  if (
    (featureData.type === "Feature" && defined(featureData.geometry)) ||
    (featureData.type === "FeatureCollection" && defined(featureData.features))
  ) {
    return featureData;
  }
}

function convertEsri(featureData) {
  return getEsriGeometry(
    featureData,
    featureData.geometryType,
    featureData.geometry && featureData.geometry.spatialReference
  );
}

// spatialReference is optional.
function getEsriGeometry(featureData, geometryType, spatialReference) {
  if (defined(featureData.features)) {
    // This is a FeatureCollection.
    return {
      type: "FeatureCollection",
      crs: esriSpatialReferenceToCrs(featureData.spatialReference),
      features: featureData.features.map(function(subFeatureData) {
        return getEsriGeometry(subFeatureData, geometryType);
      })
    };
  }
  var geoJsonFeature = {
    type: "Feature",
    geometry: undefined,
    properties: featureData.attributes
  };
  if (defined(spatialReference)) {
    geoJsonFeature.crs = esriSpatialReferenceToCrs(spatialReference);
  }
  if (geometryType === "esriGeometryPolygon") {
    // There are a bunch of differences between Esri polygons and GeoJSON polygons.
    // For GeoJSON, see https://tools.ietf.org/html/rfc7946#section-3.1.6.
    // For Esri, see http://resources.arcgis.com/en/help/arcgis-rest-api/#/Geometry_objects/02r3000000n1000000/
    // In particular:
    // 1. Esri polygons can actually be multiple polygons by using multiple outer rings.  GeoJSON polygons
    //    can only have one outer ring and we need to use a MultiPolygon to represent multiple outer rings.
    // 2. In Esri which rings are outer rings and which are holes is determined by the winding order of the
    //    rings.  In GeoJSON, the first ring is the outer ring and subsequent rings are holes.
    // 3. In Esri polygons, clockwise rings are exterior, counter-clockwise are interior.  In GeoJSON, the first
    //    (exterior) ring is expected to be counter-clockwise, though lots of implementations probably don't
    //    enforce this.  The spec says, "For backwards compatibility, parsers SHOULD NOT reject
    //    Polygons that do not follow the right-hand rule."

    // Group rings into outer rings and holes/
    const outerRings = [];
    const holes = [];
    featureData.geometry.rings.forEach(function(ring) {
      if (
        computeRingWindingOrder(ring.map(p => new Point(...p))) ===
        WindingOrder.CLOCKWISE
      ) {
        outerRings.push(ring);
      } else {
        holes.push(ring);
      }

      // Reverse the coordinate order along the way due to #3 above.
      ring.reverse();
    });

    if (outerRings.length === 0 && holes.length > 0) {
      // Well, this is pretty weird.  We have holes but not outer ring?
      // Most likely scenario is that someone messed up the winding order.
      // So let's treat all the holes as outer rings instead.
      holes.forEach(hole => {
        hole.reverse();
      });
      outerRings.push(...holes);
      holes.length = 0;
    }

    // If there's only one outer ring, we can use a `Polygon` and things are simple.
    if (outerRings.length === 1) {
      geoJsonFeature.geometry = {
        type: "Polygon",
        coordinates: [outerRings[0], ...holes]
      };
    } else {
      // Multiple (or zero!) outer rings, so we need to use a multipolygon, and we need
      // to figure out which outer ring contains each hole.
      geoJsonFeature.geometry = {
        type: "MultiPolygon",
        coordinates: outerRings.map(ring => [
          ring,
          ...findHolesInRing(ring, holes)
        ])
      };
    }
  } else if (geometryType === "esriGeometryPoint") {
    geoJsonFeature.geometry = {
      type: "Point",
      coordinates: [featureData.geometry.x, featureData.geometry.y]
    };
  } else if (geometryType === "esriGeometryPolyline") {
    geoJsonFeature.geometry = {
      type: "MultiLineString",
      coordinates: featureData.geometry.paths
    };
  } else {
    return undefined;
  }
  return geoJsonFeature;
}

function findHolesInRing(ring, holes) {
  // Return all holes where every vertex in the hole ring is inside the outer ring.
  return holes.filter(hole =>
    hole.every(coordinates => pointInPolygon(coordinates, ring))
  );
}

function esriSpatialReferenceToCrs(spatialReference) {
  if (!defined(spatialReference)) {
    return undefined;
  }

  if (spatialReference.wkid === 102100) {
    return {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:EPSG::3857"
      }
    };
  } else if (defined(spatialReference.wkid)) {
    return {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:EPSG::" + spatialReference.wkid
      }
    };
  }
  return undefined;
}

module.exports = featureDataToGeoJson;
