import { autorun } from "mobx";
import { createTransformer } from "mobx-utils";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import DataSourceCollection from "terriajs-cesium/Source/DataSources/DataSourceCollection";
import when from "terriajs-cesium/Source/ThirdParty/when";
import CesiumTileLayer from "../Map/CesiumTileLayer";
import LeafletDataSourceDisplay from "../Map/LeafletDataSourceDisplay";
import LeafletScene from "../Map/LeafletScene";
import rectangleToLatLngBounds from "../Map/rectangleToLatLngBounds";
import GlobeOrMap, { CameraView } from "./GlobeOrMap";
import Mappable, { ImageryParts } from "./Mappable";
import Terria from "./Terria";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export default class Leaflet implements GlobeOrMap {
  readonly terria: Terria;
  readonly map: L.Map;
  readonly scene: LeafletScene;
  readonly dataSources: DataSourceCollection = new DataSourceCollection();
  dataSourceDisplay?: LeafletDataSourceDisplay;

  private _disposeWorkbenchMapItemsSubscription: (() => void) | undefined;

  constructor(terria: Terria, map: L.Map) {
    this.terria = terria;
    this.map = map;
    this.scene = new LeafletScene(map);
  }

  destroy() {
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

      const allImagery = allMapItems.filter(ImageryParts.is).map(parts => ({
        parts: parts,
        layer: createImageryLayer(parts.imageryProvider)
      }));

      // Delete imagery layers no longer in the model
      this.map.eachLayer(mapLayer => {
        if (isImageryLayer(mapLayer)) {
          const index = allImagery.findIndex(im => im.layer === mapLayer);
          if (index === -1) {
            this.map.removeLayer(mapLayer);
          }
        }
      });

      // Add layer and update its zIndex
      let zIndex = 100; // Start at an arbitrary value
      allImagery.reverse().forEach(({ parts, layer }) => {
        if (parts.show) {
          layer.setOpacity(parts.alpha);
          layer.setZIndex(zIndex);
          zIndex++;

          if (!this.map.hasLayer(layer)) {
            this.map.addLayer(layer);
          }
        } else {
          this.map.removeLayer(layer);
        }
      });

      /* Handle datasources */
      const allDataSources = allMapItems.filter(isDataSource);

      // Remove deleted data sources
      let dataSources = this.dataSources;
      for (let i = 0; i < dataSources.length; i++) {
        const d = dataSources.get(i);
        if (allDataSources.indexOf(d) === -1) {
          dataSources.remove(d);
        }
      }

      // Add new data sources, remove hidden ones
      allDataSources.forEach(d => {
        if (d.show) {
          if (!dataSources.contains(d)) {
            dataSources.add(d);
          }
        } else {
          dataSources.remove(d);
        }
      });
    });
  }

  stopObserving() {
    if (this._disposeWorkbenchMapItemsSubscription !== undefined) {
      this._disposeWorkbenchMapItemsSubscription();
    }
  }

  zoomTo(
    target: CameraView | Cesium.Rectangle | Cesium.DataSource | Mappable | any,
    flightDurationSeconds: number
  ): void {
    if (!isDefined(target)) {
      return;
      //throw new DeveloperError("target is required.");
    }

    const that = this;

    return when().then(function() {
      var bounds;

      // Target is a KML data source
      if (isDefined(target.entities)) {
        if (isDefined(that.dataSourceDisplay)) {
          bounds = that.dataSourceDisplay.getLatLngBounds(target);
        }
      } else {
        let extent;

        if (target instanceof Rectangle) {
          extent = target;
        } else if (Mappable.is(target)) {
          if (isDefined(target.rectangle)) {
            const { west, south, east, north } = target.rectangle;
            if (
              isDefined(west) &&
              isDefined(south) &&
              isDefined(east) &&
              isDefined(north)
            ) {
              extent = Rectangle.fromDegrees(west, south, east, north);
            }
          } else {
            // Zoom to the first item!
            return that.zoomTo(target.mapItems[0], flightDurationSeconds);
          }
        } else {
          extent = target.rectangle;
        }

        // Account for a bounding box crossing the date line.
        if (extent.east < extent.west) {
          extent = Rectangle.clone(extent);
          extent.east += CesiumMath.TWO_PI;
        }
        bounds = rectangleToLatLngBounds(extent);
      }

      if (isDefined(bounds)) {
        that.map.flyToBounds(bounds, {
          animate: flightDurationSeconds > 0.0,
          duration: flightDurationSeconds
        });
      }
    });
  }

  notifyRepaintRequired() {
    // No action necessary.
  }
}

const createImageryLayer: (
  ip: Cesium.ImageryProvider
) => CesiumTileLayer = createTransformer((ip: Cesium.ImageryProvider) => {
  return new CesiumTileLayer(ip);
});

function isImageryLayer(someLayer: L.Layer): someLayer is CesiumTileLayer {
  return "imageryProvider" in someLayer;
}

function isDataSource(object: DataSource | ImageryParts): object is DataSource {
  return "entities" in object;
}
