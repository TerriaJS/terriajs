import L from "leaflet";
import { Math as CesiumMath } from "terriajs-cesium";
import { Rectangle } from "terriajs-cesium";

/**
 * Converts a Cesium Rectangle into a Leaflet LatLngBounds.
 * @param {Rectangle} rectangle The rectangle to convert.
 * @return {L.latLngBounds} The equivalent Leaflet latLngBounds.
 */
export default function rectangleToLatLngBounds(rectangle: Rectangle) {
  const west = CesiumMath.toDegrees(rectangle.west);
  const south = CesiumMath.toDegrees(rectangle.south);
  const east = CesiumMath.toDegrees(rectangle.east);
  const north = CesiumMath.toDegrees(rectangle.north);
  return L.latLngBounds([south, west], [north, east]);
}
