import defined from "terriajs-cesium/Source/Core/defined";
import Proj4Definitions from "./Proj4Definitions";
import urijs from "urijs";

const proj4 = require("proj4").default;
const loadText = require("../../Core/loadText");

export default {
  TERRIA_CRS: "EPSG:4326",

  /**
   * Convert a CRS string into a code that Proj4 understands.
   * @param crsString A CRS URI
   * @return A code that is recognised by Proj4 as a valid CRS code.
   */
  crsStringToCode: function (crsString: string): string | undefined {
    const crs = crsString.toLowerCase();
    let code;
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
   * @param code A CRS code that Proj4 recognises.
   * @return whether points in the CRS provided will need reprojecting.
   */
  willNeedReprojecting: function (code: string): boolean {
    if (!defined(code) || code === this.TERRIA_CRS || code === "EPSG:4283") {
      return false;
    }
    return true;
  },

  /**
   * Reproject points from one CRS to another.
   * @param coordinates which are two floating point numbers in an array in order long, lat.
   * @param  sourceCode The Proj4 code for the CRS the source coordinates are in.
   * @param  destCode The Proj4 code for the CRS the generated coordinates should be in.
   * @return coordinates in destCode CRS projection, two floating points in order long, lat.
   */
  reprojectPoint: function (
    coordinates: [number, number],
    sourceCode: string,
    destCode: string
  ): [number, number] | undefined {
    const source =
      sourceCode in Proj4Definitions
        ? new proj4.Proj(Proj4Definitions[sourceCode])
        : undefined;
    const dest =
      destCode in Proj4Definitions
        ? new proj4.Proj(Proj4Definitions[destCode])
        : undefined;
    if (!sourceCode || !destCode) {
      return;
    }
    return proj4(source, dest, coordinates);
  },

  /**
   * Add the reprojection parameters to proj4 if the code is not already known by Proj4.
   * @param  proj4ServiceBaseUrl URL relative to Terria for accessing the proj4 service
   * @param  code The Proj4 CRS code to check for and potentially add
   * @return Eventually resolves to false if code wasn't there and wasn't able to be added
   */
  checkProjection: async function (
    proj4ServiceBaseUrl: string,
    code: string
  ): Promise<boolean> {
    if (Object.prototype.hasOwnProperty.call(Proj4Definitions, code)) {
      return true;
    }

    const url = new urijs(proj4ServiceBaseUrl).segment(code).toString();
    return loadText(url)
      .then(function (proj4Text: string) {
        Proj4Definitions[code] = proj4Text;
        console.log("Added new string for", code, "=", proj4Text);
        return true;
      })
      .catch(function () {
        return false;
      });
  }
};
