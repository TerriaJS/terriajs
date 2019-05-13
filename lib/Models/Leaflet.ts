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
import L from "leaflet";
import LeafletVisualizer from "../Map/LeafletVisualizer";
import TerriaViewer from "../ViewModels/TerriaViewer";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

// This class is an observer. It probably won't contain any observables itself

export default class Leaflet implements GlobeOrMap {
  readonly terria: Terria;
  readonly terriaViewer: TerriaViewer;
  readonly map: L.Map;
  readonly scene: LeafletScene;
  readonly dataSources: DataSourceCollection = new DataSourceCollection();
  readonly dataSourceDisplay: LeafletDataSourceDisplay;
  private readonly _attributionControl: L.Control.Attribution;
  private readonly _leafletVisualizer: LeafletVisualizer;
  private readonly _disposeWorkbenchMapItemsSubscription: () => void;

  constructor(terriaViewer: TerriaViewer) {
    this.terria = terriaViewer.terria;
    this.terriaViewer = terriaViewer;
    const map = L.map(this.terriaViewer.container, {
      zoomControl: false,
      attributionControl: false,
      maxZoom: 14, //this.maximumLeafletZoomLevel,
      zoomSnap: 1, // Change to  0.2 for incremental zoom when Chrome fixes canvas scaling gaps
      preferCanvas: true,
      worldCopyJump: true
    }).setView([-28.5, 135], 5);

    this.scene = new LeafletScene(map);

    this._attributionControl = L.control.attribution({
      position: "bottomleft"
    });
    map.addControl(this._attributionControl);

    // this.map.screenSpaceEventHandler = {
    //     setInputAction : function() {},
    //     remoteInputAction : function() {}
    // };

    this._leafletVisualizer = new LeafletVisualizer();

    // const terriaLogo = this.terriaViewer.defaultTerriaCredit ? this.terriaViewer.defaultTerriaCredit.html : '';

    // const creditParts = [
    //     this._getDisclaimer(),
    //     this._developerAttribution && createCredit(this._developerAttribution.text, this._developerAttribution.link),
    //     new Credit('<a target="_blank" href="http://leafletjs.com/">Leaflet</a>')
    // ];

    // this.attributionControl.setPrefix(terriaLogo + creditParts.filter(part => defined(part)).map(credit => credit.html).join(' | '));

    // map.on("boxzoomend", function(e) {
    //     console.log(e.boxZoomBounds);
    // });

    this.dataSourceDisplay = new LeafletDataSourceDisplay({
      scene: this.scene,
      dataSourceCollection: this.dataSources,
      visualizersCallback: <any>this._leafletVisualizer.visualizersCallback // fix type error
    });

    // eventHelper = new EventHelper();

    // var that = this;
    // eventHelper.add(that.terria.clock.onTick, function(clock) {
    //     that.dataSourceDisplay.update(clock.currentTime);
    // });

    // this.leafletEventHelper = eventHelper;

    // var ticker = function() {
    //     if (defined(that.terria.leaflet)) {
    //         that.terria.clock.tick();
    //         cesiumRequestAnimationFrame(ticker);
    //     }
    // };

    // ticker();

    // this.zoomTo(rect, 0.0);

    this.map = map;
    this._disposeWorkbenchMapItemsSubscription = this.observeModelLayer();
    // return when();
  }

  destroy() {
    this._disposeWorkbenchMapItemsSubscription();
    this.dataSourceDisplay.destroy();
    this.map.remove();
  }

  private observeModelLayer() {
    return autorun(() => {
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

  getCurrentExtent() {
    const bounds = this.map.getBounds();
    return Rectangle.fromDegrees(
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    );
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
