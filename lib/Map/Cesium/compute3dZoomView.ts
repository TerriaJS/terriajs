import { isObservableArray } from "mobx";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import sampleTerrain from "terriajs-cesium/Source/Core/sampleTerrain";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import BoundingSphereState from "terriajs-cesium/Source/DataSources/BoundingSphereState";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import filterOutUndefined from "../../Core/filterOutUndefined";
import pollToPromise from "../../Core/pollToPromise";
import MappableMixin, {
  ImageryParts,
  isCesium3DTileset,
  isDataSource,
  isImageryParts,
  MapItem
} from "../../ModelMixins/MappableMixin";
import CameraView from "../../Models/CameraView";
import Cesium from "../../Models/Cesium";
import { ZoomTarget } from "../ZoomTarget";

/**
 * Result of {@link compute3dZoomView} function.
 */
export type ZoomView3d = BoundingSphere | Cartesian3 | CameraView;

/**
 * Computes the view for zooming to the target item in 3d.
 *
 * @param target The target item for which to compute the view
 * @param Instance of {@link Cesium}
 * @returns The computed 3D view or `undefined`.
 */
export default async function compute3dZoomView(
  target: ZoomTarget,
  cesium: Cesium
): Promise<ZoomView3d | undefined> {
  if (target instanceof CameraView) {
    return target;
  } else if (target instanceof Rectangle) {
    return computeViewForRectangle(target, cesium);
  } else if (MappableMixin.isMixedInto(target)) {
    return computeViewForMappable(target, cesium);
  } else if (Array.isArray(target) || isObservableArray(target)) {
    // When we are given an array of mappables, we ignore other zoom settings
    // for the individual mappables and just compute an overall BoundingSphere
    return computeBoundingSphereForMappables(
      target.filter(MappableMixin.isMixedInto),
      cesium
    );
  }
}

/**
 * Compute 3D view for the given rectangle.
 *
 * @returns a Cartesian point that can be passed to the camera.flyTo() function.
 */
async function computeViewForRectangle(
  rectangle: Rectangle,
  cesium: Cesium
): Promise<Cartesian3> {
  const scene = cesium.scene;
  // Work out the destination that the camera would naturally fly to
  // i.e the camera position needed to view the rectangle on the ellipsoid
  const destinationCartesian =
    scene.camera.getRectangleCameraCoordinates(rectangle);
  const destination =
    Ellipsoid.WGS84.cartesianToCartographic(destinationCartesian);

  // Sample the terrain elevation at the center of the rectangle
  const terrainProvider = scene.globe.terrainProvider;
  const level = 6; // A sufficiently coarse tile level that still has approximately accurate height
  const sampledCenter = Rectangle.center(rectangle);
  try {
    // sampleTerrain() updates the values in the array in place
    await sampleTerrain(terrainProvider, level, [sampledCenter]);
  } catch {
    // if the request fails just use the existing height of sampledCenter
  }

  // Add terrain elevation to camera altitude, so that when we zoom to it we do not go underground
  const finalDestinationCartographic = new Cartographic(
    destination.longitude,
    destination.latitude,
    destination.height + sampledCenter.height
  );

  const finalDestination = Ellipsoid.WGS84.cartographicToCartesian(
    finalDestinationCartographic
  );
  return finalDestination;
}

/**
 * Compute 3D view for the given mappable item
 */
async function computeViewForMappable(
  mappable: MappableMixin.Instance,
  cesium: Cesium
): Promise<BoundingSphere | Cartesian3 | CameraView | undefined> {
  if (mappable.idealZoomCameraView) {
    return mappable.idealZoomCameraView;
  }

  if (mappable.cesiumRectangle instanceof Rectangle) {
    return computeViewForRectangle(mappable.cesiumRectangle, cesium);
  }

  const boundingSphere = await computeBoundingSphereForOneMappable(
    mappable,
    cesium
  );
  return boundingSphere;
}

/**
 * Compute a bounding sphere for the given mappable
 */
async function computeBoundingSphereForOneMappable(
  mappable: MappableMixin.Instance,
  cesium: Cesium
): Promise<BoundingSphere | undefined> {
  const boundingSpheres = filterOutUndefined(
    await Promise.all(
      mappable.mapItems.map((it) => computeBoundingSphereForMapItem(it, cesium))
    )
  );
  const boundingSphere = unionBoundingSpheres(boundingSpheres);
  return boundingSphere;
}

/**
 * Compute a single bounding sphere for all the given mappables
 */
async function computeBoundingSphereForMappables(
  mappables: MappableMixin.Instance[],
  cesium: Cesium
): Promise<BoundingSphere | undefined> {
  const boundingSpheres = filterOutUndefined(
    await Promise.all(
      mappables.map((m) => computeBoundingSphereForOneMappable(m, cesium))
    )
  );
  return unionBoundingSpheres(boundingSpheres);
}

/**
 * Compute 3D view for the given mapItem
 */
async function computeBoundingSphereForMapItem(
  mapItem: MapItem,
  cesium: Cesium
): Promise<BoundingSphere | undefined> {
  if (isDataSource(mapItem)) {
    return computeBoundingSphereForDataSource(mapItem, cesium);
  } else if (isCesium3DTileset(mapItem)) {
    return computeBoundingSphereForTileset(mapItem, cesium);
  } else if (isImageryParts(mapItem)) {
    return computeBoundingSphereForImageryParts(mapItem, cesium);
  }
}

/**
 * Compute 3D view for the given `Cesium3DTileset`
 */
async function computeBoundingSphereForTileset(
  tileset: Cesium3DTileset,
  _cesium: Cesium
): Promise<BoundingSphere> {
  // Note that readyPromise is deprecated and this await should be removed when we upgrade Cesium
  await tileset.readyPromise;
  return tileset.boundingSphere;
}

/**
 * Compute 3D view for the given `DataSource`
 */
async function computeBoundingSphereForDataSource(
  dataSource: DataSource,
  cesium: Cesium
) {
  await dataSourceLoadedPromise(dataSource);

  const pollInterval = 200;
  const timeout = 30000; // 30 seconds

  const entitiesToResolve = new Set<Entity>();
  for (let entity of dataSource.entities.values) {
    entitiesToResolve.add(entity);
  }

  const boundingSpheres: BoundingSphere[] = [];
  const scratchBoundingSphere = new BoundingSphere();
  let isAnyEntityClampedToGround = false;
  await pollToPromise(
    () => {
      for (let entity of entitiesToResolve) {
        isAnyEntityClampedToGround =
          isAnyEntityClampedToGround || isEntityClampedToGround(entity);

        const state = (cesium.dataSourceDisplay as any).getBoundingSphere(
          entity,
          false,
          scratchBoundingSphere // result
        );

        if (state === BoundingSphereState.PENDING) {
          continue; // check next entity
        } else if (state === BoundingSphereState.DONE) {
          // successfully resolved bounding sphere; add to results
          entitiesToResolve.delete(entity);
          boundingSpheres.push(scratchBoundingSphere.clone());
        } else {
          // unsuccessfully resolved bounding sphere
          entitiesToResolve.delete(entity);
        }
      }

      const shouldStopPolling = entitiesToResolve.size === 0;
      return shouldStopPolling;
    },
    {
      pollInterval,
      timeout
    }
  );

  if (boundingSpheres.length === 0) {
    return;
  }

  const boundingSphere = unionBoundingSpheres(boundingSpheres);
  if (boundingSphere && isAnyEntityClampedToGround) {
    // When zooming to clamped entities from a far away point, because the high
    // LOD terrain tiles have not yet been loaded, the computed bounding sphere
    // will be inaccurate and the resulting zoom might be far off from where
    // the entity is actually placed. To get a better focus on clamped
    // entities, we sample the terrain in highest detail to precisely clamp the
    // bounding sphere to the terrain before we zoom to it.
    await preciselyClampBoundingSphereToGround(
      boundingSphere,
      cesium,
      boundingSphere
    );
  }
  return boundingSphere;
}

/**
 * Compute 3D view for the given `ImageryParts`
 */
async function computeBoundingSphereForImageryParts(
  imageryParts: ImageryParts,
  _cesium: Cesium
) {
  return BoundingSphere.fromRectangle3D(imageryParts.imageryProvider.rectangle);
}

function unionBoundingSpheres(
  boundingSpheres: BoundingSphere[]
): BoundingSphere | undefined {
  if (boundingSpheres.length === 0) {
    return undefined;
  }
  return BoundingSphere.fromBoundingSpheres(boundingSpheres);
}

/**
 * Returns a promise that fulfills when the dataSource has been loaded.
 */
function dataSourceLoadedPromise(dataSource: DataSource): Promise<DataSource> {
  return new Promise((resolve) => {
    if (dataSource.isLoading && dataSource.loadingEvent) {
      const disposeListener = dataSource.loadingEvent.addEventListener(() => {
        disposeListener();
        resolve(dataSource);
      });
    } else {
      resolve(dataSource);
    }
  });
}

/**
 * Small hack using an empty Entity to get all the graphic properties of an
 * entity. Eg `model`, `billboard`, `point` etc.
 */
const graphicProperties: (keyof Entity)[] = [
  ...new Entity().propertyNames
] as any;

/**
 * Returns true if an graphic property of the entity is clamped to ground.
 *
 * This checks if any one of the graphic property like `model`, `billboard`,
 * `point`, etc. is `heightReference`d as `CLAMP_TO_GROUND`.
 */
function isEntityClampedToGround(entity: Entity): boolean {
  const isClamped = graphicProperties.some(
    (prop) =>
      (entity[prop] as any)?.heightReference?.getValue() ===
      HeightReference.CLAMP_TO_GROUND
  );
  return isClamped;
}

/**
 * Sample the terrain to precisely clamp the `boundingSphere` to the ground.
 */
async function preciselyClampBoundingSphereToGround(
  boundingSphere: BoundingSphere,
  cesium: Cesium,
  result: BoundingSphere
): Promise<void> {
  try {
    const cartographic = Cartographic.fromCartesian(boundingSphere.center);
    const updatedCartographic = Cartographic.clone(
      cartographic,
      new Cartographic()
    );
    await sampleTerrainMostDetailed(cesium.terrainProvider, [
      updatedCartographic
    ]);
    Ellipsoid.WGS84.cartographicToCartesian(updatedCartographic, result.center);
  } catch {}
}
