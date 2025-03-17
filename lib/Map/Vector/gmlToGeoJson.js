import defined from "terriajs-cesium/Source/Core/defined";
import geoJsonGeometryFromGmlGeometry from "./geoJsonGeometryFromGmlGeometry";

const gmlNamespace = "http://www.opengis.net/gml";

/**
 * Converts a GML v3.1.1 simple features document to GeoJSON.
 * @param  {Document|String} xml The GML document.
 * @return {Object} The GeoJSON object.
 */
function gmlToGeoJson(xml) {
  if (typeof xml === "string") {
    var parser = new DOMParser();
    xml = parser.parseFromString(xml, "text/xml");
  }

  var result = [];

  var featureCollection = xml.documentElement;

  var featureMembers = featureCollection.getElementsByTagNameNS(
    gmlNamespace,
    "featureMember"
  );
  for (
    var featureIndex = 0;
    featureIndex < featureMembers.length;
    ++featureIndex
  ) {
    var featureMember = featureMembers[featureIndex];

    var properties = {};

    getGmlPropertiesRecursively(featureMember, properties);

    var feature = {
      type: "Feature",
      geometry: getGmlGeometry(featureMember),
      properties: properties
    };

    if (defined(feature.geometry)) {
      result.push(feature);
    }
  }

  return {
    type: "FeatureCollection",
    crs: { type: "EPSG", properties: { code: "4326" } },
    features: result
  };
}

var gmlSimpleFeatureNames = [
  "Curve",
  "LineString",
  "Point",
  "Polygon",
  "MultiCurve",
  "MultiPoint",
  "MultiSurface",
  "Surface"
];

function getGmlPropertiesRecursively(gmlNode, properties) {
  var isSingleValue = true;

  for (var i = 0; i < gmlNode.childNodes.length; ++i) {
    var child = gmlNode.childNodes[i];

    if (child.nodeType === Node.ELEMENT_NODE) {
      isSingleValue = false;
    }

    if (gmlSimpleFeatureNames.indexOf(child.localName) >= 0) {
      continue;
    }

    if (
      child.hasChildNodes() &&
      getGmlPropertiesRecursively(child, properties)
    ) {
      properties[child.localName] = child.textContent;
    }
  }

  return isSingleValue;
}

function getGmlGeometry(gmlNode) {
  var result;

  for (var i = 0; !defined(result) && i < gmlNode.childNodes.length; ++i) {
    var child = gmlNode.childNodes[i];

    if (gmlSimpleFeatureNames.indexOf(child.localName) >= 0) {
      return geoJsonGeometryFromGmlGeometry(child);
    } else {
      result = getGmlGeometry(child);
    }
  }

  return result;
}

export default gmlToGeoJson;
