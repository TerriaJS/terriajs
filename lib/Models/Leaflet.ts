import i18next from "i18next";
import L, { GridLayer } from "leaflet";
import { action, autorun, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import cesiumCancelAnimationFrame from "terriajs-cesium/Source/Core/cancelAnimationFrame";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Clock from "terriajs-cesium/Source/Core/Clock";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import EventHelper from "terriajs-cesium/Source/Core/EventHelper";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import cesiumRequestAnimationFrame from "terriajs-cesium/Source/Core/requestAnimationFrame";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import DataSourceCollection from "terriajs-cesium/Source/DataSources/DataSourceCollection";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import when from "terriajs-cesium/Source/ThirdParty/when";
import html2canvas from "terriajs-html2canvas";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import LatLonHeight from "../Core/LatLonHeight";
import runLater from "../Core/runLater";
import CesiumTileLayer from "../Map/CesiumTileLayer";
import LeafletDataSourceDisplay from "../Map/LeafletDataSourceDisplay";
import LeafletScene from "../Map/LeafletScene";
import LeafletSelectionIndicator from "../Map/LeafletSelectionIndicator";
import LeafletVisualizer from "../Map/LeafletVisualizer";
import MapboxVectorCanvasTileLayer from "../Map/MapboxVectorCanvasTileLayer";
import MapboxVectorTileImageryProvider from "../Map/MapboxVectorTileImageryProvider";
import PickedFeatures, {
  ProviderCoords,
  ProviderCoordsMap
} from "../Map/PickedFeatures";
import rectangleToLatLngBounds from "../Map/rectangleToLatLngBounds";
import MappableMixin, {
  ImageryParts,
  MapItem
} from "../ModelMixins/MappableMixin";
import TileErrorHandlerMixin from "../ModelMixins/TileErrorHandlerMixin";
import RasterLayerTraits from "../Traits/TraitsClasses/RasterLayerTraits";
import SplitterTraits from "../Traits/TraitsClasses/SplitterTraits";
import TerriaViewer from "../ViewModels/TerriaViewer";
import CameraView from "./CameraView";
import hasTraits from "./Definition/hasTraits";
import Feature from "./Feature";
import GlobeOrMap from "./GlobeOrMap";
import MapInteractionMode from "./MapInteractionMode";
import Terria from "./Terria";

// We want TS to look at the type declared in lib/ThirdParty/terriajs-cesium-extra/index.d.ts
// and import doesn't allows us to do that, so instead we use require + type casting to ensure
// we still maintain the type checking, without TS screaming with errors
const FeatureDetection: FeatureDetection = require("terriajs-cesium/Source/Core/FeatureDetection")
  .default;

// This class is an observer. It probably won't contain any observables itself

export default class Leaflet extends GlobeOrMap {
  readonly type = "Leaflet";
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
  private readonly _selectionIndicator: LeafletSelectionIndicator;
  private _stopRequestAnimationFrame: boolean = false;
  private _cesiumReqAnimFrameId: number | undefined;
  private _pickedFeatures: PickedFeatures | undefined = undefined;
  private _pauseMapInteractionCount = 0;

  /* Disposers */
  private readonly _disposeWorkbenchMapItemsSubscription: () => void;
  private readonly _disposeDisableInteractionSubscription: () => void;
  private _disposeSelectedFeatureSubscription?: () => void;
  private _disposeSplitterReaction: () => void;

  // These are used to split CesiumTileLayer and MapboxCanvasVectorTileLayer
  @observable size: L.Point | undefined;
  @observable nw: L.Point | undefined;
  @observable se: L.Point | undefined;

  @action
  private updateMapObservables() {
    this.size = this.map.getSize();
    this.nw = this.map.containerPointToLayerPoint([0, 0]);
    this.se = this.map.containerPointToLayerPoint(this.size);
  }

  private _createImageryLayer: (
    ip: ImageryProvider,
    clippingRectangle: Rectangle | undefined
  ) => GridLayer = computedFn((ip, clippingRectangle) => {
    const layerOptions = {
      bounds: clippingRectangle && rectangleToLatLngBounds(clippingRectangle)
    };
    if (ip instanceof MapboxVectorTileImageryProvider) {
      return new MapboxVectorCanvasTileLayer(this, ip, layerOptions);
    } else {
      return new CesiumTileLayer(this, ip, layerOptions);
    }
  });

  private _makeImageryLayerFromParts(
    parts: ImageryParts,
    item: MappableMixin.Instance
  ) {
    if (TileErrorHandlerMixin.isMixedInto(item)) {
      // because this code path can run multiple times, make sure we remove the
      // handler if it is already registered
      parts.imageryProvider.errorEvent.removeEventListener(
        item.onTileLoadError,
        item
      );
      parts.imageryProvider.errorEvent.addEventListener(
        item.onTileLoadError,
        item
      );
    }
    return this._createImageryLayer(
      parts.imageryProvider,
      parts.clippingRectangle
    );
  }

  constructor(terriaViewer: TerriaViewer, container: string | HTMLElement) {
    super();
    this.terria = terriaViewer.terria;
    this.terriaViewer = terriaViewer;
    this.map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 1, // Change to  0.2 for incremental zoom when Chrome fixes canvas scaling gaps
      preferCanvas: true,
      worldCopyJump: false
    }).setView([-28.5, 135], 5);

    this.map.on("move", () => this.updateMapObservables());
    this.map.on("zoom", () => this.updateMapObservables());

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

    this.dataSourceDisplay = new LeafletDataSourceDisplay({
      scene: this.scene,
      dataSourceCollection: this.dataSources,
      visualizersCallback: <any>this._leafletVisualizer.visualizersCallback // TODO: fix type error
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

    // Start ticker asynchronously to avoid calling an action in the consctructor
    runLater(ticker);

    this._disposeWorkbenchMapItemsSubscription = this.observeModelLayer();
    this._disposeSplitterReaction = this._reactToSplitterChanges();

    this._disposeDisableInteractionSubscription = autorun(() => {
      const map = this.map;
      const interactions = filterOutUndefined([
        map.touchZoom,
        map.doubleClickZoom,
        map.scrollWheelZoom,
        map.boxZoom,
        map.keyboard,
        map.dragging,
        map.tap
      ]);
      const pickLocation = this.pickLocation.bind(this);
      const pickFeature = (entity: Entity, event: L.LeafletMouseEvent) => {
        this._featurePicked(entity, event);
      };

      // Update mouse coords on mouse move
      this.map.on("mousemove", (e: L.LeafletEvent) => {
        const mouseEvent = <L.LeafletMouseEvent>e;
        this.mouseCoords.updateCoordinatesFromLeaflet(
          this.terria,
          mouseEvent.originalEvent
        );
      });

      if (this.terriaViewer.disableInteraction) {
        interactions.forEach(handler => handler.disable());
        this.map.off("click", pickLocation);
        this.scene.featureClicked.removeEventListener(pickFeature);
        this._disposeSelectedFeatureSubscription &&
          this._disposeSelectedFeatureSubscription();
      } else {
        interactions.forEach(handler => handler.enable());
        this.map.on("click", pickLocation);
        this.scene.featureClicked.addEventListener(pickFeature);
        this._disposeSelectedFeatureSubscription = autorun(() => {
          const feature = this.terria.selectedFeature;
          this._selectFeature(feature);
        });
      }
    });

    this._initProgressEvent();
  }

  /**
   * sets up loading listeners
   */
  private _initProgressEvent() {
    const onTileLoadChange = () => {
      var tilesLoadingCount = 0;

      this.map.eachLayer(function(layerOrGridlayer) {
        // _tiles is protected but our knockout-loading-logic accesses it here anyway
        const layer = layerOrGridlayer as any;
        if (layer?._tiles) {
          // Count all tiles not marked as loaded
          tilesLoadingCount += Object.keys(layer._tiles).filter(
            key => !layer._tiles[key].loaded
          ).length;
        }
      });

      this._updateTilesLoadingCount(tilesLoadingCount);
    };

    this.map.on(
      "layeradd",
      function(evt: any) {
        // This check makes sure we only watch tile layers, and also protects us if this private variable gets changed.
        if (typeof evt.layer._tiles !== "undefined") {
          evt.layer.on("tileloadstart tileload load", onTileLoadChange);
        }
      }.bind(this)
    );

    this.map.on(
      "layerremove",
      function(evt: any) {
        evt.layer.off("tileloadstart tileload load", onTileLoadChange);
      }.bind(this)
    );
  }

  /**
   * Pick feature from mouse click event.
   */
  private pickLocation(e: L.LeafletEvent) {
    const mouseEvent = <L.LeafletMouseEvent>e;

    // Handle click events that cross the anti-meridian
    if (mouseEvent.latlng.lng > 180 || mouseEvent.latlng.lng < -180) {
      mouseEvent.latlng = mouseEvent.latlng.wrap();
    }

    // if (!this._dragboxcompleted && that.map.dragging.enabled()) {
    this._pickFeatures(mouseEvent.latlng);
    // }
    // this._dragboxcompleted = false;
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
    this._disposeSelectedFeatureSubscription &&
      this._disposeSelectedFeatureSubscription();
    this._disposeSplitterReaction();
    this._disposeWorkbenchMapItemsSubscription();
    this._eventHelper.removeAll();
    this._disposeDisableInteractionSubscription();
    // This variable prevents a race condition if destroy() is called
    // synchronously as a result of timelineClock ticking due to ticker()
    this._stopRequestAnimationFrame = true;
    if (isDefined(this._cesiumReqAnimFrameId)) {
      cesiumCancelAnimationFrame(this._cesiumReqAnimFrameId);
    }
    this.dataSourceDisplay.destroy();
    this.map.off("move");
    this.map.off("zoom");
    this.map.remove();
  }

  private observeModelLayer() {
    return autorun(() => {
      const catalogItems = [
        ...this.terriaViewer.items.get(),
        this.terriaViewer.baseMap
      ];
      // Flatmap
      const allImageryMapItems = ([] as {
        item: MappableMixin.Instance;
        parts: ImageryParts;
      }[]).concat(
        ...catalogItems
          .filter(isDefined)
          .map(item =>
            item.mapItems
              .filter(ImageryParts.is)
              .map((parts: ImageryParts) => ({ item, parts }))
          )
      );

      const allImagery = allImageryMapItems.map(({ item, parts }) => {
        if (hasTraits(item, RasterLayerTraits, "leafletUpdateInterval")) {
          (parts.imageryProvider as any)._leafletUpdateInterval =
            item.leafletUpdateInterval;
        }
        return {
          parts: parts,
          layer: this._makeImageryLayerFromParts(parts, item)
        };
      });

      // Delete imagery layers no longer in the model
      this.map.eachLayer(mapLayer => {
        if (
          isImageryLayer(mapLayer) ||
          mapLayer instanceof MapboxVectorCanvasTileLayer
        ) {
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
      const allMapItems = ([] as MapItem[]).concat(
        ...catalogItems.filter(isDefined).map(item => item.mapItems)
      );
      const allDataSources = allMapItems.filter(isDataSource);

      // Remove deleted data sources
      let dataSources = this.dataSources;
      for (let i = 0; i < dataSources.length; i++) {
        const d = dataSources.get(i);
        if (allDataSources.indexOf(d) === -1) {
          dataSources.remove(d);
          --i;
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

      // Ensure stacking order matches order in allDataSources - first item appears on top.
      allDataSources.forEach(d => dataSources.raiseToTop(d));
    });
  }

  doZoomTo(
    target: CameraView | Rectangle | DataSource | MappableMixin.Instance | any,
    flightDurationSeconds: number = 3.0
  ): Promise<void> {
    if (!isDefined(target)) {
      return Promise.resolve();
      //throw new DeveloperError("target is required.");
    }
    let bounds;

    // Target is a KML data source
    if (isDefined(target.entities)) {
      if (isDefined(this.dataSourceDisplay)) {
        bounds = this.dataSourceDisplay.getLatLngBounds(target);
      }
    } else {
      let extent;

      if (target instanceof Rectangle) {
        extent = target;
      } else if (target instanceof CameraView) {
        extent = target.rectangle;
      } else if (MappableMixin.isMixedInto(target)) {
        if (isDefined(target.cesiumRectangle)) {
          extent = target.cesiumRectangle;
        }
        if (!isDefined(extent)) {
          // Zoom to the first item!
          return this.doZoomTo(target.mapItems[0], flightDurationSeconds);
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
      this.map.flyToBounds(bounds, {
        animate: flightDurationSeconds > 0.0,
        duration: flightDurationSeconds
      });
    }

    return Promise.resolve();
  }

  getCurrentCameraView(): CameraView {
    const bounds = this.map.getBounds();
    return new CameraView(
      Rectangle.fromDegrees(
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      )
    );
  }

  notifyRepaintRequired() {
    // No action necessary.
  }

  pickFromLocation(
    latLngHeight: LatLonHeight,
    providerCoords: ProviderCoordsMap,
    existingFeatures: Feature[]
  ) {
    this._pickFeatures(
      L.latLng({
        lat: latLngHeight.latitude,
        lng: latLngHeight.longitude,
        alt: latLngHeight.height
      }),
      providerCoords,
      existingFeatures
    );
  }

  /**
   * Return features at a latitude, longitude and (optionally) height for the given imageryLayer.
   * @param latLngHeight The position on the earth to pick
   * @param providerCoords A map of imagery provider urls to the tile coords used to get features for those imagery
   * @returns A flat array of all the features for the given tiles that are currently on the map
   */
  @action
  async getFeaturesAtLocation(
    latLngHeight: LatLonHeight,
    providerCoords: ProviderCoordsMap
  ) {
    const pickMode = new MapInteractionMode({
      message: i18next.t("models.imageryLayer.resolvingAvailability"),
      onCancel: () => {
        this.terria.mapInteractionModeStack.pop();
      }
    });
    this.terria.mapInteractionModeStack.push(pickMode);
    this._pickFeatures(
      L.latLng({
        lat: latLngHeight.latitude,
        lng: latLngHeight.longitude,
        alt: latLngHeight.height
      }),
      providerCoords,
      [],
      true
    );

    if (pickMode.pickedFeatures) {
      const pickedFeatures = pickMode.pickedFeatures;
      await pickedFeatures.allFeaturesAvailablePromise;
    }

    return runInAction(() => {
      this.terria.mapInteractionModeStack.pop();
      return pickMode.pickedFeatures?.features;
    });
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

  @action
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
    existingFeatures?: Entity[],
    ignoreSplitter: boolean = false
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
      runInAction(() => {
        const mapInteractionModeStack = this.terria.mapInteractionModeStack;
        if (
          isDefined(mapInteractionModeStack) &&
          mapInteractionModeStack.length > 0
        ) {
          const pickedFeatures =
            mapInteractionModeStack[mapInteractionModeStack.length - 1]
              .pickedFeatures;
          if (isDefined(pickedFeatures)) {
            pickedFeatures.pickPosition = newPickLocation;
          }
        } else if (isDefined(this.terria.pickedFeatures)) {
          this.terria.pickedFeatures.pickPosition = newPickLocation;
        }
      });

      // Unset this so that the next click will start building features from scratch.
      this._pickedFeatures = undefined;
    });

    const imageryLayers: CesiumTileLayer[] = [];
    if (this.terria.allowFeatureInfoRequests) {
      this.map.eachLayer(layer => {
        if (isImageryLayer(layer)) {
          imageryLayers.push(layer);
        }
      });
    }

    // we need items sorted in reverse order by their zIndex to get correct ordering of feature info
    imageryLayers.sort((a: CesiumTileLayer, b: CesiumTileLayer) => {
      if (!isDefined(a.options.zIndex) || !isDefined(b.options.zIndex)) {
        return 0;
      }
      if (a.options.zIndex < b.options.zIndex) {
        return 1;
      }
      if (a.options.zIndex > b.options.zIndex) {
        return -1;
      }
      return 0;
    });

    tileCoordinates = defaultValue(tileCoordinates, {});

    const pickedLocation = Cartographic.fromDegrees(latlng.lng, latlng.lat);
    this._pickedFeatures.pickPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pickedLocation
    );

    // We want the all available promise to return after the cleanup one to
    // make sure all vector click events have resolved.
    const promises = [cleanup].concat(
      imageryLayers.map(async imageryLayer => {
        const imageryLayerUrl = (<any>imageryLayer.imageryProvider).url;
        const longRadians = CesiumMath.toRadians(latlng.lng);
        const latRadians = CesiumMath.toRadians(latlng.lat);

        if (tileCoordinates[imageryLayerUrl])
          return tileCoordinates[imageryLayerUrl];

        const coords = await imageryLayer.getFeaturePickingCoords(
          this.map,
          longRadians,
          latRadians
        );

        const features = await imageryLayer.pickFeatures(
          coords.x,
          coords.y,
          coords.level,
          longRadians,
          latRadians
        );

        return {
          features: features,
          imageryLayer: imageryLayer,
          coords: coords
        };
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

        runInAction(() => {
          pickedFeatures.isLoading = false;
        });

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

        const features = filteredResults.reduce((allFeatures, result) => {
          if (
            this.terria.showSplitter &&
            ignoreSplitter === false &&
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
        }, pickedFeatures.features);
        runInAction(() => {
          pickedFeatures.features = features;
        });
      })
      .catch(e => {
        runInAction(() => {
          pickedFeatures.isLoading = false;
          pickedFeatures.error =
            "An unknown error occurred while picking features.";
        });
        throw e;
      });

    runInAction(() => {
      const mapInteractionModeStack = this.terria.mapInteractionModeStack;
      if (
        isDefined(mapInteractionModeStack) &&
        mapInteractionModeStack.length > 0
      ) {
        mapInteractionModeStack[
          mapInteractionModeStack.length - 1
        ].pickedFeatures = this._pickedFeatures;
      } else {
        this.terria.pickedFeatures = this._pickedFeatures;
      }
    });
  }

  _reactToSplitterChanges() {
    return autorun(() => {
      const items = this.terria.mainViewer.items.get();
      const showSplitter = this.terria.showSplitter;
      const splitPosition = this.terria.splitPosition;
      items.forEach(item => {
        if (
          MappableMixin.isMixedInto(item) &&
          hasTraits(item, SplitterTraits, "splitDirection")
        ) {
          const layers = this.getImageryLayersForItem(item);
          const splitDirection = item.splitDirection;

          layers.forEach(
            action(layer => {
              if (showSplitter) {
                layer.splitDirection = splitDirection;
                layer.splitPosition = splitPosition;
              } else {
                layer.splitDirection = ImagerySplitDirection.NONE;
                layer.splitPosition = splitPosition;
              }
            })
          );
        }
      });
      this.notifyRepaintRequired();
    });
  }

  getImageryLayersForItem(
    item: MappableMixin.Instance
  ): (CesiumTileLayer | MapboxVectorCanvasTileLayer)[] {
    return filterOutUndefined(
      item.mapItems.map(m => {
        if (ImageryParts.is(m)) {
          const layer = this._makeImageryLayerFromParts(m, item);
          return layer instanceof CesiumTileLayer ||
            layer instanceof MapboxVectorCanvasTileLayer
            ? layer
            : undefined;
        }
      })
    );
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

  private _selectFeature(feature: Feature | undefined) {
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

  getClipsForSplitter(): any {
    let clipLeft: string = "";
    let clipRight: string = "";
    let clipPositionWithinMap: number = 0;
    let clipX: number = 0;
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

  isSplitterDragThumb(element: HTMLElement): boolean | "" {
    return (
      element.className &&
      element.className.indexOf &&
      element.className.indexOf("tjs-splitter__thumb") >= 0
    );
  }

  captureScreenshot(): Promise<string> {
    // Temporarily hide the map credits.
    this._attributionControl.remove();

    try {
      // html2canvas can't handle the clip style which is used for the splitter. So if the splitter is active, we render
      // a left image and a right image and compose them. Also remove the splitter drag thumb.
      let promise: any;
      if (this.terria.showSplitter) {
        const clips = this.getClipsForSplitter();
        const clipLeft = clips.left.replace(/ /g, "");
        const clipRight = clips.right.replace(/ /g, "");
        promise = html2canvas(this.map.getContainer(), {
          useCORS: true,
          ignoreElements: (element: HTMLElement) =>
            (element.style.clip !== undefined &&
              element.style.clip !== null &&
              element.style.clip.replace(/ /g, "") === clipRight) ||
            this.isSplitterDragThumb(element)
        }).then((leftCanvas: HTMLCanvasElement) => {
          return html2canvas(this.map.getContainer(), {
            useCORS: true,
            ignoreElements: (element: HTMLElement) =>
              (element.style.clip !== undefined &&
                element.style.clip !== null &&
                element.style.clip.replace(/ /g, "") === clipLeft) ||
              this.isSplitterDragThumb(element)
          }).then((rightCanvas: HTMLCanvasElement) => {
            const combined = document.createElement("canvas");
            combined.width = leftCanvas.width;
            combined.height = leftCanvas.height;
            const context: CanvasRenderingContext2D | null = combined.getContext(
              "2d"
            );
            if (context === undefined || context === null) {
              // Error
              return null;
            }

            const split = clips.clipPositionWithinMap * window.devicePixelRatio;
            context.drawImage(
              leftCanvas,
              0,
              0,
              split,
              combined.height,
              0,
              0,
              split,
              combined.height
            );
            context.drawImage(
              rightCanvas,
              split,
              0,
              combined.width - split,
              combined.height,
              split,
              0,
              combined.width - split,
              combined.height
            );
            return combined;
          });
        });
      } else {
        promise = html2canvas(this.map.getContainer(), {
          useCORS: true
        });
      }

      return new Promise<string>((resolve, reject) => {
        // wrap old-style when promise with new standard library promise
        when(promise)
          .then((canvas: HTMLCanvasElement) => {
            resolve(canvas.toDataURL("image/png"));
          })
          .always(() => {
            this._attributionControl.addTo(this.map);
          });
      });
    } catch (e) {
      this._attributionControl.addTo(this.map);
      return Promise.reject(e);
    }
  }

  _addVectorTileHighlight(
    imageryProvider: MapboxVectorTileImageryProvider,
    rectangle: Rectangle
  ): () => void {
    const map = this.map;
    const options: any = {
      opacity: 1,
      bounds: rectangleToLatLngBounds(rectangle)
    };

    if (isDefined(map.options.maxZoom)) {
      options.maxZoom = map.options.maxZoom;
    }

    const layer = new MapboxVectorCanvasTileLayer(
      this,
      imageryProvider,
      options
    );
    layer.addTo(map);
    layer.bringToFront();

    return function() {
      map.removeLayer(layer);
    };
  }
}

function isImageryLayer(someLayer: L.Layer): someLayer is CesiumTileLayer {
  return "imageryProvider" in someLayer;
}

function isDataSource(object: MapItem): object is DataSource {
  return "entities" in object;
}
