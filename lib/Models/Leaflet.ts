import L from "leaflet";
import { autorun } from "mobx";
import { createTransformer } from "mobx-utils";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Clock from "terriajs-cesium/Source/Core/Clock";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import DataSourceCollection from "terriajs-cesium/Source/DataSources/DataSourceCollection";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import EventHelper from "terriajs-cesium/Source/Core/EventHelper";
import FeatureDetection from "terriajs-cesium/Source/Core/FeatureDetection";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import LeafletDataSourceDisplay from "../Map/LeafletDataSourceDisplay";
import LeafletScene from "../Map/LeafletScene";
import LeafletVisualizer from "../Map/LeafletVisualizer";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import cesiumRequestAnimationFrame from "terriajs-cesium/Source/Core/requestAnimationFrame";
import cesiumCancelAnimationFrame from "terriajs-cesium/Source/Core/cancelAnimationFrame";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import when from "terriajs-cesium/Source/ThirdParty/when";

import CesiumTileLayer from "../Map/CesiumTileLayer";
import Feature from "./Feature";
import GlobeOrMap, { CameraView } from "./GlobeOrMap";
import LeafletSelectionIndicator from "../Map/LeafletSelectionIndicator";
import Mappable, { ImageryParts } from "./Mappable";
import PickedFeatures, {
  ProviderCoords,
  ProviderCoordsMap
} from "../Map/PickedFeatures";
import Terria from "./Terria";
import TerriaViewer from "../ViewModels/TerriaViewer";
import rectangleToLatLngBounds from "../Map/rectangleToLatLngBounds";
import runLater from "../Core/runLater";
import hasTraits from "./hasTraits";
import SplitterTraits from "../Traits/SplitterTraits";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import isDefined from "../Core/isDefined";

interface SplitterClips {
  left: string;
  right: string;
  clipPositionWithinMap?: number;
  clipX?: number;
}

// As of Internet Explorer 11.483.15063.0 and Edge 40.15063.0.0 (EdgeHTML 15.15063) there is an apparent
// bug in both browsers where setting the `clip` CSS style on our Leaflet layers does not consistently
// cause the new clip to be applied.  The change shows up in the DOM inspector, but it is not reflected
// in the rendered view.  You can reproduce it by adding a layer and toggling it between left/both/right
// repeatedly, and you will quickly see it fail to update sometimes.  Unfortunateely my attempts to
// reproduce this in jsfiddle were unsuccessful, so presumably there is something unusual about our
// setup.  In any case, we do the usually-horrible thing here of detecting these browsers by their user
// agent, and then work around the bug by hiding the DOM element, forcing it to updated by asking for
// its bounding client rectangle, and then showing it again.  There's a bit of a performance hit to
// this, so we don't do it on other browsers that do not experience this bug.
const useClipUpdateWorkaround =
  FeatureDetection.isInternetExplorer() || FeatureDetection.isEdge();

// This class is an observer. It probably won't contain any observables itself

export default class Leaflet extends GlobeOrMap {
  readonly terria: Terria;
  readonly terriaViewer: TerriaViewer;
  readonly map: L.Map;
  readonly scene: LeafletScene;
  readonly dataSources: DataSourceCollection = new DataSourceCollection();
  readonly dataSourceDisplay: LeafletDataSourceDisplay;
  readonly canShowSplitter = true;
  private readonly _attributionControl: L.Control.Attribution;
  private readonly _leafletVisualizer: LeafletVisualizer;
  private readonly _eventHelper: EventHelper;
  private _stopRequestAnimationFrame: boolean = false;
  private _cesiumReqAnimFrameId: number | undefined;
  private _pickedFeatures: PickedFeatures | undefined = undefined;
  private _pauseMapInteractionCount = 0;

  /* Disposers */
  private readonly _disposeWorkbenchMapItemsSubscription: () => void;
  private readonly _disposeSplitterPositionSubscription: () => void;
  private readonly _disposeShowSplitterSubscription: () => void;
  private readonly _selectionIndicator: LeafletSelectionIndicator;
  private readonly _disposeSelectedFeatureSubscription: () => void;

  constructor(terriaViewer: TerriaViewer) {
    super();
    this.terria = terriaViewer.terria;
    this.terriaViewer = terriaViewer;
    this.map = L.map(this.terriaViewer.container, {
      zoomControl: false,
      attributionControl: false,
      maxZoom: 14, //this.maximumLeafletZoomLevel,
      zoomSnap: 1, // Change to  0.2 for incremental zoom when Chrome fixes canvas scaling gaps
      preferCanvas: true,
      worldCopyJump: true
    }).setView([-28.5, 135], 5);

    this.scene = new LeafletScene(this.map);

    this._attributionControl = L.control.attribution({
      position: "bottomleft"
    });
    this.map.addControl(this._attributionControl);

    // this.map.screenSpaceEventHandler = {
    //     setInputAction : function() {},
    //     remoteInputAction : function() {}
    // };

    this._leafletVisualizer = new LeafletVisualizer();
    this._selectionIndicator = new LeafletSelectionIndicator(this);

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

    this.map.on("click", e => {
      // if (!that._dragboxcompleted && that.map.dragging.enabled()) {
      this._pickFeatures((<L.LeafletMouseEvent>e).latlng);
      // }
      // that._dragboxcompleted = false;
    });

    this.scene.featureClicked.addEventListener((entity, event) => {
      this._featurePicked(entity, event);
    });

    this.dataSourceDisplay = new LeafletDataSourceDisplay({
      scene: this.scene,
      dataSourceCollection: this.dataSources,
      visualizersCallback: <any>this._leafletVisualizer.visualizersCallback // fix type error
    });

    this._eventHelper = new EventHelper();

    this._eventHelper.add(this.terria.timelineClock.onTick, <any>((
      clock: Clock
    ) => {
      this.dataSourceDisplay.update(clock.currentTime);
    }));

    const ticker = () => {
      if (!this._stopRequestAnimationFrame) {
        this.terria.timelineClock.tick();
        this._cesiumReqAnimFrameId = cesiumRequestAnimationFrame(ticker);
      }
    };

    ticker();

    this._disposeSelectedFeatureSubscription = autorun(() => {
      this._selectFeature();
    });

    this._disposeWorkbenchMapItemsSubscription = this.observeModelLayer();

    this._disposeSplitterPositionSubscription = autorun(() => {
      this.terria.workbench.items.forEach(item => {
        const clips = this._getClipsForSplitter();
        if (Mappable.is(item)) {
          this._updateItemForSplitter(item, clips);
        }
      });
    });

    this._disposeShowSplitterSubscription = autorun(() => {
      this.terria.workbench.items.forEach(item => {
        const clips = this._getClipsForSplitter();
        if (Mappable.is(item)) {
          this._updateItemForSplitter(item, clips);
        }
      });
    });
  }

  getContainer() {
    return this.map.getContainer();
  }

  pauseMapInteraction() {
    ++this._pauseMapInteractionCount;
    if (this._pauseMapInteractionCount === 1) {
      this.map.dragging.disable();
    }
  }

  resumeMapInteraction() {
    --this._pauseMapInteractionCount;
    if (this._pauseMapInteractionCount === 0) {
      setTimeout(() => {
        if (this._pauseMapInteractionCount === 0) {
          this.map.dragging.enable();
        }
      }, 0);
    }
  }

  destroy() {
    this._disposeSelectedFeatureSubscription();
    this._disposeWorkbenchMapItemsSubscription();
    this._disposeShowSplitterSubscription();
    this._disposeSplitterPositionSubscription();
    this._eventHelper.removeAll();
    // This variable prevents a race condition if destroy() is called
    // synchronously as a result of timelineClock ticking due to ticker()
    this._stopRequestAnimationFrame = true;
    if (isDefined(this._cesiumReqAnimFrameId)) {
      cesiumCancelAnimationFrame(this._cesiumReqAnimFrameId);
    }
    this.dataSourceDisplay.destroy();
    this.map.remove();
  }

  private observeModelLayer() {
    return autorun(() => {
      const catalogItems = [
        ...this.terria.workbench.items,
        this.terriaViewer.baseMap
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

  /*
   * There are two "listeners" for clicks which are set up in our constructor.
   * - One fires for any click: `map.on('click', ...`.  It calls `pickFeatures`.
   * - One fires only for vector features: `this.scene.featureClicked.addEventListener`.
   *    It calls `featurePicked`, which calls `pickFeatures` and then adds the feature it found, if any.
   * These events can fire in either order.
   * Billboards do not fire the first event.
   *
   * Note that `pickFeatures` does nothing if `leaflet._pickedFeatures` is already set.
   * Otherwise, it sets it, runs `runLater` to clear it, and starts the asynchronous raster feature picking.
   *
   * So:
   * If only the first event is received, it triggers the raster-feature picking as desired.
   * If both are received in the order above, the second adds the vector features to the list of raster features as desired.
   * If both are received in the reverse order, the vector-feature click kicks off the same behavior as the other click would have;
   * and when the next click is received, it is ignored - again, as desired.
   */

  private _featurePicked(entity: Entity, event: L.LeafletMouseEvent) {
    this._pickFeatures(event.latlng);

    // Ignore clicks on the feature highlight.
    if (entity.entityCollection && entity.entityCollection.owner) {
      const owner = entity.entityCollection.owner;
      if (
        owner instanceof DataSource &&
        owner.name == GlobeOrMap._featureHighlightName
      ) {
        return;
      }
    }

    const feature = Feature.fromEntityCollectionOrEntity(entity);
    if (isDefined(this._pickedFeatures)) {
      this._pickedFeatures.features.push(feature);

      if (isDefined(entity) && entity.position) {
        this._pickedFeatures.pickPosition = (<any>entity.position)._value;
      }
    }
  }

  private _pickFeatures(
    latlng: L.LatLng,
    tileCoordinates?: any,
    existingFeatures?: Entity[]
  ) {
    if (isDefined(this._pickedFeatures)) {
      // Picking is already in progress.
      return;
    }

    this._pickedFeatures = new PickedFeatures();

    if (isDefined(existingFeatures)) {
      this._pickedFeatures.features = existingFeatures;
    }

    // We run this later because vector click events and the map click event can come through in any order, but we can
    // be reasonably sure that all of them will be processed by the time our runLater func is invoked.
    const cleanup = runLater(() => {
      // Set this again just in case a vector pick came through and reset it to the vector's position.
      const newPickLocation = Ellipsoid.WGS84.cartographicToCartesian(
        pickedLocation
      );
      // TODO
      // const mapInteractionModeStack = this.terria.mapInteractionModeStack;
      // if (
      //   defined(mapInteractionModeStack) &&
      //   mapInteractionModeStack.length > 0
      // ) {
      //   mapInteractionModeStack[
      //     mapInteractionModeStack.length - 1
      //   ].pickedFeatures.pickPosition = newPickLocation;
      // } else
      if (isDefined(this.terria.pickedFeatures)) {
        this.terria.pickedFeatures.pickPosition = newPickLocation;
      }

      // Unset this so that the next click will start building features from scratch.
      this._pickedFeatures = undefined;
    });

    const imageryLayers: CesiumTileLayer[] = [];
    this.map.eachLayer(layer => {
      if (isImageryLayer(layer)) {
        imageryLayers.push(layer);
      }
    });
    tileCoordinates = defaultValue(tileCoordinates, {});

    const pickedLocation = Cartographic.fromDegrees(latlng.lng, latlng.lat);
    this._pickedFeatures.pickPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pickedLocation
    );

    // We want the all available promise to return after the cleanup one to make sure all vector click events have resolved.
    const promises = [cleanup].concat(
      imageryLayers.map(imageryLayer => {
        const imageryLayerUrl = (<any>imageryLayer.imageryProvider).url;
        const longRadians = CesiumMath.toRadians(latlng.lng);
        const latRadians = CesiumMath.toRadians(latlng.lat);

        if (tileCoordinates[imageryLayerUrl]) {
          return Promise.resolve(tileCoordinates[imageryLayerUrl]);
        } else {
          return imageryLayer
            .getFeaturePickingCoords(this.map, longRadians, latRadians)
            .then(coords => {
              return imageryLayer
                .pickFeatures(
                  coords.x,
                  coords.y,
                  coords.level,
                  longRadians,
                  latRadians
                )
                .then(features => {
                  return {
                    features: features,
                    imageryLayer: imageryLayer,
                    coords: coords
                  };
                });
            });
        }
      })
    );

    const pickedFeatures = this._pickedFeatures;

    pickedFeatures.allFeaturesAvailablePromise = Promise.all(promises)
      .then((results: any) => {
        // Get rid of the cleanup promise
        const promiseResult: {
          features: ImageryLayerFeatureInfo[];
          imageryLayer: CesiumTileLayer;
          coords: ProviderCoords;
        }[] = results.slice(1);

        pickedFeatures.isLoading = false;
        pickedFeatures.providerCoords = {};

        const filteredResults = promiseResult.filter(function(result) {
          return isDefined(result.features) && result.features.length > 0;
        });

        pickedFeatures.providerCoords = filteredResults.reduce(function(
          coordsSoFar: ProviderCoordsMap,
          result
        ) {
          const imageryProvider = result.imageryLayer.imageryProvider;
          coordsSoFar[(<any>imageryProvider).url] = result.coords;
          return coordsSoFar;
        },
        {});

        pickedFeatures.features = filteredResults.reduce(
          (allFeatures, result) => {
            if (
              this.terria.showSplitter &&
              isDefined(pickedFeatures.pickPosition)
            ) {
              // Skip this feature, unless the imagery layer is on the picked side or
              // belongs to both sides of the splitter
              const screenPosition = this._computePositionOnScreen(
                pickedFeatures.pickPosition
              );
              const pickedSide = this._getSplitterSideForScreenPosition(
                screenPosition
              );
              const layerDirection = result.imageryLayer.splitDirection;

              if (
                !(
                  layerDirection === pickedSide ||
                  layerDirection === ImagerySplitDirection.NONE
                )
              ) {
                return allFeatures;
              }
            }

            return allFeatures.concat(
              result.features.map(feature => {
                (<any>feature).imageryLayer = result.imageryLayer;

                // For features without a position, use the picked location.
                if (!isDefined(feature.position)) {
                  feature.position = pickedLocation;
                }

                return this._createFeatureFromImageryLayerFeature(feature);
              })
            );
          },
          pickedFeatures.features
        );
      })
      .catch(e => {
        pickedFeatures.isLoading = false;
        pickedFeatures.error =
          "An unknown error occurred while picking features.";

        throw e;
      });

    // TODO
    // const mapInteractionModeStack = this.terria.mapInteractionModeStack;
    // if (
    //   defined(mapInteractionModeStack) &&
    //   mapInteractionModeStack.length > 0
    // ) {
    //   mapInteractionModeStack[
    //     mapInteractionModeStack.length - 1
    //   ].pickedFeatures = this._pickedFeatures;
    // } else {
    this.terria.pickedFeatures = this._pickedFeatures;
    // }
  }

  private _updateItemForSplitter(
    item: Mappable,
    clips: SplitterClips | undefined
  ) {
    if (!hasTraits(item, SplitterTraits, "splitDirection")) {
      return;
    }

    this._imageryLayersForItem(item).forEach(layer => {
      const container = layer.getContainer();
      if (!container) {
        return;
      }

      const { left: clipLeft, right: clipRight } =
        clips || this._getClipsForSplitter();

      let display = null;
      if (useClipUpdateWorkaround) {
        display = container.style.display;
        container.style.display = "none";
        container.getBoundingClientRect();
      }

      if (item.splitDirection === ImagerySplitDirection.LEFT) {
        container.style.clip = clipLeft;
      } else if (item.splitDirection === ImagerySplitDirection.RIGHT) {
        container.style.clip = clipRight;
      } else {
        container.style.clip = "auto";
      }

      layer.splitDirection = item.splitDirection;
      if (useClipUpdateWorkaround) {
        container.style.display = display;
      }
    });
  }

  private _imageryLayersForItem(item: Mappable): CesiumTileLayer[] {
    const allImageryParts = item.mapItems.filter(ImageryParts.is);
    const imageryLayers: CesiumTileLayer[] = [];
    this.map.eachLayer(layer => {
      if (isImageryLayer(layer)) {
        const found = allImageryParts.find(
          p => p.imageryProvider === layer.imageryProvider
        );
        if (found) {
          imageryLayers.push(layer);
        }
      }
    });
    return imageryLayers;
  }

  private _getClipsForSplitter(): SplitterClips {
    let clipLeft = "";
    let clipRight = "";
    let clipPositionWithinMap;
    let clipX;
    if (this.terria.showSplitter) {
      const map = this.map;
      const size = map.getSize();
      const nw = map.containerPointToLayerPoint([0, 0]);
      const se = map.containerPointToLayerPoint(size);
      clipPositionWithinMap = size.x * this.terria.splitPosition;
      clipX = Math.round(nw.x + clipPositionWithinMap);
      clipLeft = "rect(" + [nw.y, clipX, se.y, nw.x].join("px,") + "px)";
      clipRight = "rect(" + [nw.y, se.x, se.y, clipX].join("px,") + "px)";
    }

    return {
      left: clipLeft,
      right: clipRight,
      clipPositionWithinMap: clipPositionWithinMap,
      clipX: clipX
    };
  }

  /**
   * Computes the screen position of a given world position.
   * @param position The world position in Earth-centered Fixed coordinates.
   * @param [result] The instance to which to copy the result.
   * @return The screen position, or undefined if the position is not on the screen.
   */
  private _computePositionOnScreen(
    position: Cartesian3,
    result?: Cartesian2
  ): Cartesian2 {
    const cartographicScratch = new Cartographic();
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
      position,
      cartographicScratch
    );
    const point = this.map.latLngToContainerPoint(
      L.latLng(
        CesiumMath.toDegrees(cartographic.latitude),
        CesiumMath.toDegrees(cartographic.longitude)
      )
    );

    if (isDefined(result)) {
      result.x = point.x;
      result.y = point.y;
    } else {
      result = new Cartesian2(point.x, point.y);
    }
    return result;
  }

  private _selectFeature() {
    const feature = this.terria.selectedFeature;

    this._highlightFeature(feature);

    if (isDefined(feature) && isDefined(feature.position)) {
      const cartographicScratch = new Cartographic();
      const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
        feature.position.getValue(this.terria.timelineClock.currentTime),
        cartographicScratch
      );
      this._selectionIndicator.setLatLng(
        L.latLng([
          CesiumMath.toDegrees(cartographic.latitude),
          CesiumMath.toDegrees(cartographic.longitude)
        ])
      );
      this._selectionIndicator.animateSelectionIndicatorAppear();
    } else {
      this._selectionIndicator.animateSelectionIndicatorDepart();
    }
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
