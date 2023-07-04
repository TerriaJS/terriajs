import L from "leaflet";
import { isObservableArray } from "mobx";
import { DataSource } from "terriajs-cesium";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import filterOutUndefined from "../../Core/filterOutUndefined";
import MappableMixin, {
  ImageryParts,
  isDataSource,
  isImageryParts,
  MapItem
} from "../../ModelMixins/MappableMixin";
import CameraView from "../../Models/CameraView";
import Leaflet from "../../Models/Leaflet";
import { ZoomTarget } from "../ZoomTarget";

/**
 * Result of {@link compute2dZoomView} function. Something that can be zoomed to in 2D.
 */
export type ZoomView2d = L.LatLngBounds;

/**
 * Computes the 2D view for zooming to the target item.
 *
 * @param target The zoom target for which to compute the view
 * @param leaflet The {@link Leaflet} instance
 * @returns The computed 2d zoom view or `undefined`
 */
export default async function compute2dZoomView(
  target: ZoomTarget,
  leaflet: Leaflet
): Promise<ZoomView2d | undefined> {
  if (target instanceof Rectangle) {
    return computeBoundsForRectangle(target);
  } else if (target instanceof CameraView) {
    return computeBoundsForCameraView(target);
  } else if (MappableMixin.isMixedInto(target)) {
    return computeBoundsForMappable(target, leaflet);
  } else if (Array.isArray(target) || isObservableArray(target)) {
    return computeBoundsForAllMappables(target, leaflet);
  }
}

/**
 * Get the 2d bounds of a mappable instance.
 *
 * This resolves the bounds in the following order:
 *   1. `idealZoom` settings
 *   1. `rectangle` settings
 *   2. The union of bounds of all 2D `mapItems`.
 *   3. Otherwise returns `undefined`.
 */
function computeBoundsForMappable(
  mappable: MappableMixin.Instance,
  leaflet: Leaflet
): L.LatLngBounds | undefined {
  if (mappable.idealZoomCameraView) {
    return computeBoundsForCameraView(mappable.idealZoomCameraView);
  }

  if (mappable.cesiumRectangle) {
    return computeBoundsForRectangle(mappable.cesiumRectangle);
  }

  return unionBounds(
    filterOutUndefined(
      mappable.mapItems.map((it) => computeBoundsForMapItem(it, leaflet))
    )
  );
}

/**
 * Compute a single bound covering all the given mappables.
 */
function computeBoundsForAllMappables(
  mappables: MappableMixin.Instance[],
  leaflet: Leaflet
): L.LatLngBounds | undefined {
  return unionBounds(
    filterOutUndefined(
      mappables.map((m) => computeBoundsForMappable(m, leaflet))
    )
  );
}

/**
 * Returns bounds of the 2D mapItem or undefined if it is not 2d.
 */
function computeBoundsForMapItem(
  mapItem: MapItem,
  leaflet: Leaflet
): L.LatLngBounds | undefined {
  if (isDataSource(mapItem)) {
    return computeBoundsForDataSource(mapItem, leaflet);
  } else if (isImageryParts(mapItem)) {
    return computeBoundsForImagery(mapItem);
  }
}

/**
 * Computes the 2D bounds of a `DataSource`.
 */
function computeBoundsForDataSource(
  dataSource: DataSource,
  leaflet: Leaflet
): L.LatLngBounds | undefined {
  return leaflet.dataSourceDisplay.getLatLngBounds(dataSource);
}

/**
 * Computes the 2D bounds of an `ImageryPart`.
 */
function computeBoundsForImagery(imageryParts: ImageryParts): L.LatLngBounds {
  return computeBoundsForRectangle(imageryParts.imageryProvider.rectangle);
}

/**
 * Computes the 2D bounds of a `CameraView`.
 */
function computeBoundsForCameraView(cameraView: CameraView): L.LatLngBounds {
  return computeBoundsForRectangle(cameraView.rectangle);
}

/**
 * Converts the rectangle extent to leaflet LatLngBounds object.
 *
 * Additionally wraps the extent to account for date line crossing.
 */
function computeBoundsForRectangle(rectangle: Rectangle): L.LatLngBounds {
  // Account for a bounding box crossing the date line.
  // Not sure how this works - inherited from v7
  let eastRadians = rectangle.east;
  if (eastRadians < rectangle.west) {
    eastRadians += CesiumMath.TWO_PI;
  }

  const west = CesiumMath.toDegrees(rectangle.west);
  const south = CesiumMath.toDegrees(rectangle.south);
  const east = CesiumMath.toDegrees(eastRadians);
  const north = CesiumMath.toDegrees(rectangle.north);

  return L.latLngBounds([south, west], [north, east]);
}

function unionBounds(bounds: L.LatLngBounds[]): L.LatLngBounds | undefined {
  return bounds.reduce(
    (acc: L.LatLngBounds | undefined, bound: L.LatLngBounds | undefined) => {
      acc = acc ?? bound;
      if (acc && bound) acc.extend(bound);
      return acc;
    },
    undefined
  );
}
