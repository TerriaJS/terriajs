var defined = require("terriajs-cesium/Source/Core/defined").default;
var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var i18next = require("i18next").default;

var featureCreators = {
  Point: createPointGeometry
};

function geoJsonGeometryFromW3cGeometry(geometry) {
  var type = "Point";
  var creator = featureCreators[type];
  if (!defined(creator)) {
    throw new RuntimeError(
      i18next.t("map.w3cToGeoJson.containsUnsupportedFeatureType", {
        type: type
      })
    );
  }

  return creator(geometry);
}

function createPointGeometry(geometry) {
  /*
    avoid using geo namespace since user defines it in different way 
    and we already know that Point in W3C geometry supports only lat and long elements
    http://www.w3.org/2003/01/geo/wgs84_pos# and http://www.w3.org/2003/01/geo/
   */
  var latitude = geometry.getElementsByTagNameNS("*", "lat")[0].textContent;
  var longitude = geometry.getElementsByTagNameNS("*", "long")[0].textContent;
  return {
    type: "Point",
    coordinates: [longitude, latitude]
  };
}

module.exports = geoJsonGeometryFromW3cGeometry;
