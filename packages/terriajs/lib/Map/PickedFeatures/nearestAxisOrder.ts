import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";

/**
 * Correct a picked feature whose position came back with latitude and
 * longitude the wrong way around, as some servers return GeoJSON points
 * (e.g. Copernicus Marine WMTS).
 *
 * Both readings are valid numbers, so the picked location decides: a feature
 * is by definition near where the user clicked, while the transposed reading
 * is usually far away. The server's order is kept unless swapping is strictly
 * closer, and a swap that would put latitude beyond the poles is rejected.
 */
export default function nearestAxisOrder(
  feature: ImageryLayerFeatureInfo,
  pickedLocation: Cartographic
): ImageryLayerFeatureInfo {
  const position = feature.position;
  if (!position) return feature;

  const swapped = new Cartographic(
    position.latitude,
    position.longitude,
    position.height
  );
  if (Math.abs(swapped.latitude) > CesiumMath.PI_OVER_TWO) return feature;

  const distanceSquared = (p: Cartographic) =>
    (p.longitude - pickedLocation.longitude) ** 2 +
    (p.latitude - pickedLocation.latitude) ** 2;
  if (distanceSquared(swapped) < distanceSquared(position)) {
    feature.position = swapped;
  }
  return feature;
}
