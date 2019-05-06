import { autorun } from "mobx";
import { createTransformer } from "mobx-utils";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import HeadingPitchRange from "terriajs-cesium/Source/Core/HeadingPitchRange";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import sampleTerrain from "terriajs-cesium/Source/Core/sampleTerrain";
import BoundingSphereState from "terriajs-cesium/Source/DataSources/BoundingSphereState";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import DataSourceCollection from "terriajs-cesium/Source/DataSources/DataSourceCollection";
import ImageryLayer from "terriajs-cesium/Source/Scene/ImageryLayer";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import when from "terriajs-cesium/Source/ThirdParty/when";
import CesiumWidget from "terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget";
import isDefined from "../Core/isDefined";
import pollToPromise from "../Core/pollToPromise";
import CesiumRenderLoopPauser from "../Map/CesiumRenderLoopPauser";
import GlobeOrMap, { CameraView } from "./GlobeOrMap";
import Mappable, { ImageryParts } from "./Mappable";
import Terria from "./Terria";

export default class Cesium implements GlobeOrMap {
  readonly terria: Terria;
  readonly cesiumWidget: CesiumWidget;
  readonly scene: Scene;
  readonly dataSources: DataSourceCollection = new DataSourceCollection();
  dataSourceDisplay: Cesium.DataSourceDisplay | undefined;
  readonly pauser: CesiumRenderLoopPauser;

  private _disposeWorkbenchMapItemsSubscription: (() => void) | undefined;

  constructor(terria: Terria, cesiumWidget: CesiumWidget) {
    this.terria = terria;
    this.cesiumWidget = cesiumWidget;
    this.scene = cesiumWidget.scene;
    this.pauser = new CesiumRenderLoopPauser(this.cesiumWidget);
  }

  destroy() {
    this.pauser.destroy();
    this.stopObserving();
  }

  observeModelLayer() {
    this._disposeWorkbenchMapItemsSubscription = autorun(() => {
      const catalogItems = [
        ...this.terria.workbench.items,
        this.terria.baseMap
      ];
      // Flatmap
      const allMapItems = ([] as (DataSource | ImageryParts)[]).concat(
        ...catalogItems
          .filter(isDefined)
          .filter(Mappable.is)
          .map(item => item.mapItems)
      );
      // TODO: Look up the type in a map and call the associated function.
      //       That way the supported types of map items is extensible.

      const allDataSources = allMapItems.filter(isDataSource);

      // Remove deleted data sources
      let dataSources = this.dataSources;
      for (let i = 0; i < dataSources.length; i++) {
        const d = dataSources.get(i);
        if (allDataSources.indexOf(d) === -1) {
          dataSources.remove(d);
        }
      }

      // Add new data sources
      allDataSources.forEach(d => {
        if (!dataSources.contains(d)) {
          dataSources.add(d);
        }
      });

      // This is the Cesium ImageryLayer, not our Typescript one
      const allImageryParts = allMapItems
        .filter(ImageryParts.is)
        .map(makeImageryLayerFromParts);

      // Delete imagery layers that are no longer in the model
      for (let i = 0; i < this.scene.imageryLayers.length; i++) {
        const imageryLayer = this.scene.imageryLayers.get(i);
        if (allImageryParts.indexOf(imageryLayer) === -1) {
          this.scene.imageryLayers.remove(imageryLayer);
          --i;
        }
      }
      // Iterate backwards so that adding multiple layers adds them in increasing cesium index order
      for (
        let modelIndex = allImageryParts.length - 1;
        modelIndex >= 0;
        modelIndex--
      ) {
        const mapItem = allImageryParts[modelIndex];

        const targetCesiumIndex = allImageryParts.length - modelIndex - 1;
        const currentCesiumIndex = this.scene.imageryLayers.indexOf(mapItem);
        if (currentCesiumIndex === -1) {
          this.scene.imageryLayers.add(mapItem, targetCesiumIndex);
        } else if (currentCesiumIndex > targetCesiumIndex) {
          for (let j = currentCesiumIndex; j > targetCesiumIndex; j--) {
            this.scene.imageryLayers.lower(mapItem);
          }
        } else if (currentCesiumIndex < targetCesiumIndex) {
          for (let j = currentCesiumIndex; j < targetCesiumIndex; j++) {
            this.scene.imageryLayers.raise(mapItem);
          }
        }
      }

      this.notifyRepaintRequired();
    });
  }

  stopObserving() {
    if (this._disposeWorkbenchMapItemsSubscription !== undefined) {
      this._disposeWorkbenchMapItemsSubscription();
    }
  }

  zoomTo(
    target:
      | CameraView
      | Cesium.Rectangle
      | Cesium.DataSource
      | Mappable
      | /*TODO Cesium.Cesium3DTileset*/ any,
    flightDurationSeconds: number
  ): void {
    if (!defined(target)) {
      return;
      //throw new DeveloperError("viewOrExtent is required.");
    }

    flightDurationSeconds = defaultValue(flightDurationSeconds, 3.0);

    var that = this;

    return when()
      .then(function() {
        if (target instanceof Rectangle) {
          var camera = that.scene.camera;

          // Work out the destination that the camera would naturally fly to
          var destinationCartesian = camera.getRectangleCameraCoordinates(
            target
          );
          var destination = Ellipsoid.WGS84.cartesianToCartographic(
            destinationCartesian
          );
          var terrainProvider = that.scene.globe.terrainProvider;
          var level = 6; // A sufficiently coarse tile level that still has approximately accurate height
          var positions = [Rectangle.center(target)];

          // Perform an elevation query at the centre of the rectangle
          return sampleTerrain(terrainProvider, level, positions).then(function(
            results
          ) {
            var finalDestinationCartographic = new Cartographic(
              destination.longitude,
              destination.latitude,
              destination.height + results[0].height
            );

            var finalDestination = Ellipsoid.WGS84.cartographicToCartesian(
              finalDestinationCartographic
            );

            camera.flyTo({
              duration: flightDurationSeconds,
              destination: finalDestination
            });
          });
        } else if (defined(target.entities)) {
          // Zooming to a DataSource
          if (target.isLoading && defined(target.loadingEvent)) {
            var deferred = when.defer();
            var removeEvent = target.loadingEvent.addEventListener(function() {
              removeEvent();
              deferred.resolve();
            });
            return deferred.promise.then(function() {
              return zoomToDataSource(that, target, flightDurationSeconds);
            });
          }
          return zoomToDataSource(that, target);
        } else if (defined(target.readyPromise)) {
          return target.readyPromise.then(function() {
            if (defined(target.boundingSphere)) {
              zoomToBoundingSphere(that, target, flightDurationSeconds);
            }
          });
        } else if (defined(target.boundingSphere)) {
          return zoomToBoundingSphere(that, target);
        } else if (target.position !== undefined) {
          that.scene.camera.flyTo({
            duration: flightDurationSeconds,
            destination: target.position,
            orientation: {
              direction: target.direction,
              up: target.up
            }
          });
        } else if (Mappable.is(target)) {
          if (isDefined(target.rectangle)) {
            const { west, south, east, north } = target.rectangle;
            if (
              isDefined(west) &&
              isDefined(south) &&
              isDefined(east) &&
              isDefined(north)
            ) {
              return that.scene.camera.flyTo({
                duration: flightDurationSeconds,
                destination: Rectangle.fromDegrees(west, south, east, north)
              });
            }
          }

          if (target.mapItems.length > 0) {
            // Zoom to the first item!
            return that.zoomTo(target.mapItems[0], flightDurationSeconds);
          }
        } else if (defined(target.rectangle)) {
          that.scene.camera.flyTo({
            duration: flightDurationSeconds,
            destination: target.rectangle
          });
        }
      })
      .then(function() {
        that.notifyRepaintRequired();
      });
  }

  notifyRepaintRequired() {
    this.pauser.notifyRepaintRequired();
  }
}

var boundingSphereScratch = new BoundingSphere();

function zoomToDataSource(
  cesium: Cesium,
  target: Cesium.DataSource,
  flightDurationSeconds?: number
): Promise<void> {
  return pollToPromise(
    function() {
      const dataSourceDisplay = cesium.dataSourceDisplay;
      if (dataSourceDisplay === undefined) {
        return false;
      }

      var entities = target.entities.values;

      var boundingSpheres = [];
      for (var i = 0, len = entities.length; i < len; i++) {
        var state = BoundingSphereState.PENDING;
        try {
          // TODO: missing Cesium type info
          state = (<any>dataSourceDisplay).getBoundingSphere(
            entities[i],
            false,
            boundingSphereScratch
          );
        } catch (e) {}

        if (state === BoundingSphereState.PENDING) {
          return false;
        } else if (state !== BoundingSphereState.FAILED) {
          boundingSpheres.push(BoundingSphere.clone(boundingSphereScratch));
        }
      }

      var boundingSphere = BoundingSphere.fromBoundingSpheres(boundingSpheres);
      cesium.scene.camera.flyToBoundingSphere(boundingSphere, {
        duration: flightDurationSeconds
      });
      return true;
    },
    {
      pollInterval: 100,
      timeout: 5000
    }
  );
}

function zoomToBoundingSphere(
  cesium: Cesium,
  target: {
    boundingSphere: Cesium.BoundingSphere;
    modelMatrix?: Cesium.Matrix4;
  },
  flightDurationSeconds?: number
) {
  var boundingSphere = target.boundingSphere;
  var modelMatrix = target.modelMatrix;
  if (modelMatrix) {
    boundingSphere = BoundingSphere.transform(boundingSphere, modelMatrix);
  }
  cesium.scene.camera.flyToBoundingSphere(boundingSphere, {
    offset: new HeadingPitchRange(0.0, -0.5, boundingSphere.radius),
    duration: flightDurationSeconds
  });
}

const createImageryLayer: (
  ip: Cesium.ImageryProvider
) => Cesium.ImageryLayer = createTransformer((ip: Cesium.ImageryProvider) => {
  console.log("Creating a new ImageryLayer");
  return new ImageryLayer(ip);
});

function makeImageryLayerFromParts(parts: ImageryParts): Cesium.ImageryLayer {
  const layer = createImageryLayer(parts.imageryProvider);

  layer.alpha = parts.alpha;
  layer.show = parts.show;
  return layer;
}

function isDataSource(object: DataSource | ImageryParts): object is DataSource {
  return "entities" in object;
}
