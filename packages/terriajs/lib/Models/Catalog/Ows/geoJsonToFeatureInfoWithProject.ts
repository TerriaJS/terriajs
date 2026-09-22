import { FeatureCollection } from "geojson";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import GeographicProjection from "terriajs-cesium/Source/Core/GeographicProjection";
import MapProjection from "terriajs-cesium/Source/Core/MapProjection";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";

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

      // GeoJSON (RFC 7946) is always lon/lat, but GeoServer answers in the
      // request CRS. Treat values that fit degrees as degrees; projected
      // metres only fall in that range within ~180 m of the origin.
      const looksLikeDegrees = Math.abs(x) <= 180 && Math.abs(y) <= 90;
      if (
        !projection ||
        projection instanceof GeographicProjection ||
        looksLikeDegrees
      ) {
        featureInfo.position = Cartographic.fromDegrees(x, y);
      } else {
        const positionInMeters = new Cartesian3(x, y, 0);
        const cartographic = projection.unproject(positionInMeters);
        featureInfo.position = cartographic;
      }
    }

    result.push(featureInfo);
  }

  return result;
}
