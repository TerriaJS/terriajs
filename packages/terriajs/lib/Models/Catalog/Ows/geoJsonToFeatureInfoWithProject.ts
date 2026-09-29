import { FeatureCollection } from "geojson";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import GeographicProjection from "terriajs-cesium/Source/Core/GeographicProjection";
import MapProjection from "terriajs-cesium/Source/Core/MapProjection";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import isDefined from "../../../Core/isDefined";

/**
 * Whether a response's coordinates are in the projection's units rather than
 * degrees.
 *
 * GeoJSON is lon/lat by definition (RFC 7946), but GeoServer answers
 * GetFeatureInfo in the CRS that was requested - metres for a Web Mercator
 * request - and says so in the deprecated `crs` member that GeoJSON 2008
 * defined. Believe that member where it is present, and take a response that
 * does not name a CRS at its word.
 */
function isProjected(
  json: FeatureCollection,
  projection?: MapProjection
): boolean {
  if (!projection || projection instanceof GeographicProjection) return false;

  const name = (
    json as {
      crs?: { properties?: { name?: string } };
    }
  ).crs?.properties?.name;
  if (!isDefined(name)) return false;

  return !GEOGRAPHIC_CRS.some((crs) => crs.test(name));
}

/** CRS names whose coordinates are degrees. */
const GEOGRAPHIC_CRS = [/EPSG.*4326/, /EPSG.*4283/, /CRS.*84/];

/**
 * Convert a GetFeatureInfo GeoJSON response into Cesium feature infos,
 * reprojecting coordinates to geographic when necessary so positions land in
 * the right place on the map.
 *
 * Cesium's own [GetFeatureInfoFormat](https://github.com/CesiumGS/cesium/blob/5754031f65646bee5f9d0e9a56dec7d3677a8b08/packages/engine/Source/Scene/GetFeatureInfoFormat.js#L74)
 * assumes the response is geographic, which does not hold when the tiling
 * scheme is projected.
 */
export default function geoJsonToFeatureInfoWithProject(
  json: FeatureCollection,
  projection?: MapProjection
) {
  const projected = isProjected(json, projection);
  const result = [];

  const features = json.features;
  for (let i = 0; i < features.length; ++i) {
    const feature = features[i];

    const featureInfo = new ImageryLayerFeatureInfo();
    featureInfo.data = feature;
    featureInfo.properties = feature.properties;
    featureInfo.configureNameFromProperties(feature.properties);
    featureInfo.configureDescriptionFromProperties(feature.properties);

    // If this is a point feature, use the coordinates of the point.
    if (!!feature.geometry && feature.geometry.type === "Point") {
      const x = feature.geometry.coordinates[0];
      const y = feature.geometry.coordinates[1];

      if (projected) {
        featureInfo.position = projection!.unproject(new Cartesian3(x, y, 0));
      } else {
        featureInfo.position = Cartographic.fromDegrees(x, y);
      }
    }

    result.push(featureInfo);
  }

  return result;
}
