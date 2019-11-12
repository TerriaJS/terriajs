"use strict";

/*global require*/
var proj4 = require("proj4").default;
var loadText = require("../Core/loadText");
var defined = require("terriajs-cesium/Source/Core/defined").default;
var Proj4Definitions = require("../Map/Proj4Definitions");
var urijs = require("urijs");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var Reproject = {
  TERRIA_CRS: "EPSG:4326",

  /**
   * Convert a CRS string into a code that Proj4 understands.
   * @param {String} crsString A CRS URI
   * @return {String} A code that is recognised by Proj4 as a valid CRS code.
   */
  crsStringToCode: function(crsString) {
    var crs = crsString.toLowerCase();
    var code;
    if (crs.indexOf("epsg:") === 0) {
      code = crsString.toUpperCase();
    } else if (crs.indexOf("urn:ogc:def:crs:epsg::") === 0) {
      code = "EPSG:" + crsString.substring("urn:ogc:def:crs:EPSG::".length);
    } else if (crs.indexOf("urn:ogc:def:crs:epsg") === 0) {
      // With version
      code = "EPSG:" + crsString.substring("urn:ogc:def:crs:EPSG::x.x".length);
    } else if (crs.indexOf("crs84") !== -1) {
      code = this.TERRIA_CRS;
    }
    return code;
  },

  /**
   * A point will need reprojecting if it isn't using the same (or equivalent) CRS as TerriaJS.
   * TerriaJS is assumed to be using EPSG:4326.
   *
   * If the code is not defined, it's assumed that the point/s will not need reprojecting as we don't know what the
   * source is, so we can't reproject anyway.
   *
   * @param {String} code A CRS code that Proj4 recognises.
   * @return {Bool} whether points in the CRS provided will need reprojecting.
   */
  willNeedReprojecting: function(code) {
    if (!defined(code) || code === this.TERRIA_CRS || code === "EPSG:4283") {
      return false;
    }
    return true;
  },

  /**
   * Reproject points from one CRS to another.
   * @param {Array} coordinates which are two floating point numbers in an array in order long, lat.
   * @param {String} sourceCode The Proj4 code for the CRS the source coordinates are in.
   * @param {String} destCode The Proj4 code for the CRS the generated coordinates should be in.
   * @return {Array} coordinates in destCode CRS projection, two floating points in order long, lat.
   */
  reprojectPoint: function(coordinates, sourceCode, destCode) {
    var source = new proj4.Proj(Proj4Definitions[sourceCode]);
    var dest = new proj4.Proj(Proj4Definitions[destCode]);
    return proj4(source, dest, coordinates);
  },

  /**
   * Add the reprojection parameters to proj4 if the code is not already known by Proj4.
   * @param {String} proj4ServiceBaseUrl URL relative to Terria for accessing the proj4 service
   * @param {String} code The Proj4 CRS code to check for and potentially add
   * @return {Promise} Eventually resolves to false if code wasn't there and wasn't able to be added
   */
  checkProjection: function(proj4ServiceBaseUrl, code) {
    if (Proj4Definitions.hasOwnProperty(code)) {
      return true;
    }

    var url = new urijs(proj4ServiceBaseUrl).segment(code).toString();
    return when(
      loadText(url),
      function(proj4Text) {
        Proj4Definitions[code] = proj4Text;
        console.log("Added new string for", code, "=", proj4Text);
        return true;
      },
      function(err) {
        return false;
      }
    );
  }
};

module.exports = Reproject;
