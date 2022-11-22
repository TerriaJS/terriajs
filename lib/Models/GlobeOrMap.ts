import { action, computed, observable, runInAction } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import isDefined from "../Core/isDefined";
import { isJsonObject } from "../Core/Json";
import LatLonHeight from "../Core/LatLonHeight";
import MapboxVectorTileImageryProvider from "../Map/ImageryProvider/MapboxVectorTileImageryProvider";
import ProtomapsImageryProvider from "../Map/ImageryProvider/ProtomapsImageryProvider";
import featureDataToGeoJson from "../Map/PickedFeatures/featureDataToGeoJson";
import { ProviderCoordsMap } from "../Map/PickedFeatures/PickedFeatures";
import MappableMixin from "../ModelMixins/MappableMixin";
import TimeVarying from "../ModelMixins/TimeVarying";
import MouseCoords from "../ReactViewModels/MouseCoords";
import TableColorStyleTraits from "../Traits/TraitsClasses/Table/ColorStyleTraits";
import TableOutlineStyleTraits, {
  OutlineSymbolTraits
} from "../Traits/TraitsClasses/Table/OutlineStyleTraits";
import TableStyleTraits from "../Traits/TraitsClasses/Table/StyleTraits";
import CameraView from "./CameraView";
import Cesium3DTilesCatalogItem from "./Catalog/CatalogItems/Cesium3DTilesCatalogItem";
import CommonStrata from "./Definition/CommonStrata";
import createStratumInstance from "./Definition/createStratumInstance";
import TerriaFeature from "./Feature/Feature";
import Terria from "./Terria";

require("./Feature/ImageryLayerFeatureInfo"); // overrides Cesium's prototype.configureDescriptionFromProperties

export default abstract class GlobeOrMap {
  abstract readonly type: string;
  abstract readonly terria: Terria;
  abstract readonly canShowSplitter: boolean;

  public static featureHighlightID = "___$FeatureHighlight&__";
  protected static _featureHighlightName = "TerriaJS Feature Highlight Marker";

  private _removeHighlightCallback?: () => Promise<void> | void;
  private _highlightPromise: Promise<unknown> | undefined;
  private _tilesLoadingCountMax: number = 0;
  protected supportsPolylinesOnTerrain?: boolean;

  // True if zoomTo() was called and the map is currently zooming to dataset
  @observable isMapZooming = false;

  // An internal id to track an in progress call to zoomTo()
  _currentZoomId?: string;

  // This is updated by Leaflet and Cesium objects.
  // Avoid duplicate mousemove events.  Why would we get duplicate mousemove events?  I'm glad you asked:
  // http://stackoverflow.com/questions/17818493/mousemove-event-repeating-every-second/17819113
  // I (Kevin Ring) see this consistently on my laptop when Windows Media Player is running.
  @observable mouseCoords: MouseCoords = new MouseCoords();

  abstract destroy(): void;

  abstract doZoomTo(
    target: CameraView | Rectangle | MappableMixin.Instance,
    flightDurationSeconds: number
  ): Promise<void>;

  /**
   * Zoom map to a dataset or the given bounds.
   *
   * @param target A bounds item to zoom to
   * @param flightDurationSeconds Optional time in seconds for the zoom animation to complete
   * @returns A promise that resolves when the zoom animation is complete
   */
  @action
  zoomTo(
    target: CameraView | Rectangle | MappableMixin.Instance,
    flightDurationSeconds: number = 3.0
  ): Promise<void> {
    this.isMapZooming = true;
    const zoomId = createGuid();
    this._currentZoomId = zoomId;
    return this.doZoomTo(target, flightDurationSeconds).finally(
      action(() => {
        // Unset isMapZooming only if the local zoomId matches _currentZoomId.
        // If they do not match, it means there was another call to zoomTo which
        // could still be in progress and it will handle unsetting isMapZooming.
        if (zoomId === this._currentZoomId) {
          this.isMapZooming = false;
          this._currentZoomId = undefined;
          if (MappableMixin.isMixedInto(target) && TimeVarying.is(target)) {
            // Set the target as the source for timeline
            this.terria.timelineStack.promoteToTop(target);
          }
        }
      })
    );
  }

  abstract getCurrentCameraView(): CameraView;

  /* Gets the current container element.
   */
  abstract getContainer(): Element | undefined;

  abstract pauseMapInteraction(): void;
  abstract resumeMapInteraction(): void;

  abstract notifyRepaintRequired(): void;

  /**
   * List of the attributions (credits) for data currently displayed on map.
   */
  @computed
  get attributions(): string[] {
    return [];
  }
  /**
   * Picks features based off a latitude, longitude and (optionally) height.
   * @param latLngHeight The position on the earth to pick.
   * @param providerCoords A map of imagery provider urls to the coords used to get features for those imagery
   *     providers - i.e. x, y, level
   * @param existingFeatures An optional list of existing features to concatenate the ones found from asynchronous picking to.
   */
  abstract pickFromLocation(
    latLngHeight: LatLonHeight,
    providerCoords: ProviderCoordsMap,
    existingFeatures: TerriaFeature[]
  ): void;

  /**
   * Return features at a latitude, longitude and (optionally) height for the given imagery layers.
   * @param latLngHeight The position on the earth to pick
   * @param providerCoords A map of imagery provider urls to the tile coords used to get features for those imagery
   * @returns A flat array of all the features for the given tiles that are currently on the map
   */
  abstract getFeaturesAtLocation(
    latLngHeight: LatLonHeight,
    providerCoords: ProviderCoordsMap
  ): Promise<Entity[] | undefined> | void;

  /**
   * Creates a {@see Feature} (based on an {@see Entity}) from a {@see ImageryLayerFeatureInfo}.
   * @param imageryFeature The imagery layer feature for which to create an entity-based feature.
   * @return The created feature.
   */
  protected _createFeatureFromImageryLayerFeature(
    imageryFeature: ImageryLayerFeatureInfo
  ) {
    const feature = new TerriaFeature({
      id: imageryFeature.name
    });
    feature.name = imageryFeature.name;
    if (imageryFeature.description) {
      feature.description = new ConstantProperty(imageryFeature.description); // already defined by the new Entity
    }
    feature.properties = imageryFeature.properties;
    feature.data = imageryFeature.data;
    feature.imageryLayer = imageryFeature.imageryLayer;

    if (imageryFeature.position) {
      feature.position = new ConstantPositionProperty(
        Ellipsoid.WGS84.cartographicToCartesian(imageryFeature.position)
      );
    }

    (<any>feature).coords = (<any>imageryFeature).coords;

    return feature;
  }

  /**
   * Adds loading progress for cesium
   */
  protected _updateTilesLoadingCount(tilesLoadingCount: number): void {
    if (tilesLoadingCount > this._tilesLoadingCountMax) {
      this._tilesLoadingCountMax = tilesLoadingCount;
    } else if (tilesLoadingCount === 0) {
      this._tilesLoadingCountMax = 0;
    }

    this.terria.tileLoadProgressEvent.raiseEvent(
      tilesLoadingCount,
      this._tilesLoadingCountMax
    );
  }

  /**
   * Adds loading progress (boolean) for 3DTileset layers where total tiles is not known
   */
  protected _updateTilesLoadingIndeterminate(loading: boolean): void {
    this.terria.indeterminateTileLoadProgressEvent.raiseEvent(loading);
  }

  /**
   * Returns the side of the splitter the `position` lies on.
   *
   * @param The screen position.
   * @return The side of the splitter on which `position` lies.
   */
  protected _getSplitterSideForScreenPosition(
    position: Cartesian2 | Cartesian3
  ): SplitDirection | undefined {
    const container = this.terria.currentViewer.getContainer();
    if (!isDefined(container)) {
      return;
    }

    const splitterX = container.clientWidth * this.terria.splitPosition;
    if (position.x <= splitterX) {
      return SplitDirection.LEFT;
    } else {
      return SplitDirection.RIGHT;
    }
  }

  abstract _addVectorTileHighlight(
    imageryProvider: MapboxVectorTileImageryProvider | ProtomapsImageryProvider,
    rectangle: Rectangle
  ): () => void;

  async _highlightFeature(feature: TerriaFeature | undefined) {
    if (isDefined(this._removeHighlightCallback)) {
      await this._removeHighlightCallback();
      this._removeHighlightCallback = undefined;
      this._highlightPromise = undefined;
    }

    // Lazy import here to avoid cyclic dependencies.
    const { default: GeoJsonCatalogItem } = await import(
      "./Catalog/CatalogItems/GeoJsonCatalogItem"
    );

    if (isDefined(feature)) {
      let hasGeometry = false;

      if (isDefined(feature._cesium3DTileFeature)) {
        const originalColor = feature._cesium3DTileFeature.color;
        const defaultColor = Color.fromCssColorString("#fffffe");

        // Get the highlight color from the catalogItem trait or default to baseMapContrastColor
        const catalogItem = feature._catalogItem;
        let highlightColor;
        if (catalogItem instanceof Cesium3DTilesCatalogItem) {
          highlightColor =
            Color.fromCssColorString(
              runInAction(() => catalogItem.highlightColor)
            ) ?? defaultColor;
        } else {
          highlightColor =
            Color.fromCssColorString(this.terria.baseMapContrastColor) ??
            defaultColor;
        }

        // highlighting doesn't work if the highlight colour is full white
        // so in this case use something close to white instead
        feature._cesium3DTileFeature.color = Color.equals(
          highlightColor,
          Color.WHITE
        )
          ? defaultColor
          : highlightColor;

        this._removeHighlightCallback = function () {
          if (
            isDefined(feature._cesium3DTileFeature) &&
            !feature._cesium3DTileFeature.tileset.isDestroyed()
          ) {
            feature._cesium3DTileFeature.color = originalColor;
          }
        };
      } else if (isDefined(feature.polygon)) {
        hasGeometry = true;

        const cesiumPolygon = feature.cesiumEntity || feature;

        const polygonOutline = cesiumPolygon.polygon!.outline;
        const polygonOutlineColor = cesiumPolygon.polygon!.outlineColor;
        const polygonMaterial = cesiumPolygon.polygon!.material;

        cesiumPolygon.polygon!.outline = new ConstantProperty(true);
        cesiumPolygon.polygon!.outlineColor = new ConstantProperty(
          Color.fromCssColorString(this.terria.baseMapContrastColor) ??
            Color.GRAY
        );
        cesiumPolygon.polygon!.material = new ColorMaterialProperty(
          new ConstantProperty(
            (
              Color.fromCssColorString(this.terria.baseMapContrastColor) ??
              Color.LIGHTGRAY
            ).withAlpha(0.75)
          )
        );

        this._removeHighlightCallback = function () {
          if (cesiumPolygon.polygon) {
            cesiumPolygon.polygon.outline = polygonOutline;
            cesiumPolygon.polygon.outlineColor = polygonOutlineColor;
            cesiumPolygon.polygon.material = polygonMaterial;
          }
        };
      } else if (isDefined(feature.polyline)) {
        hasGeometry = true;

        const cesiumPolyline = feature.cesiumEntity || feature;

        const polylineMaterial = cesiumPolyline.polyline!.material;
        const polylineWidth = cesiumPolyline.polyline!.width;

        (<any>cesiumPolyline).polyline.material =
          Color.fromCssColorString(this.terria.baseMapContrastColor) ??
          Color.LIGHTGRAY;
        cesiumPolyline.polyline!.width = new ConstantProperty(2);

        this._removeHighlightCallback = function () {
          if (cesiumPolyline.polyline) {
            cesiumPolyline.polyline.material = polylineMaterial;
            cesiumPolyline.polyline.width = polylineWidth;
          }
        };
      }

      if (!hasGeometry) {
        let vectorTileHighlightCreated = false;
        // Feature from MapboxVectorTileImageryProvider
        if (
          feature.imageryLayer?.imageryProvider instanceof
          MapboxVectorTileImageryProvider
        ) {
          const featureId =
            (isJsonObject(feature.data) ? feature.data?.id : undefined) ??
            feature.properties?.id?.getValue?.();
          if (isDefined(featureId)) {
            const highlightImageryProvider =
              feature.imageryLayer?.imageryProvider.createHighlightImageryProvider(
                featureId
              );
            this._removeHighlightCallback =
              this.terria.currentViewer._addVectorTileHighlight(
                highlightImageryProvider,
                feature.imageryLayer.imageryProvider.rectangle
              );
          }
          vectorTileHighlightCreated = true;
        }
        // Feature from ProtomapsImageryProvider (replacement for MapboxVectorTileImageryProvider)
        else if (
          feature.imageryLayer?.imageryProvider instanceof
          ProtomapsImageryProvider
        ) {
          const highlightImageryProvider =
            feature.imageryLayer.imageryProvider.createHighlightImageryProvider(
              feature
            );
          if (highlightImageryProvider)
            this._removeHighlightCallback =
              this.terria.currentViewer._addVectorTileHighlight(
                highlightImageryProvider,
                feature.imageryLayer.imageryProvider.rectangle
              );
          vectorTileHighlightCreated = true;
        }

        // No vector tile highlight was created so try to convert feature to GeoJSON
        // This flag is necessary to check as it is possible for a feature to use ProtomapsImageryProvider and also have GeoJson data - but maybe failed to createHighlightImageryProvider
        if (!vectorTileHighlightCreated) {
          const geoJson = featureDataToGeoJson(feature.data);

          // Don't show points; the targeting cursor is sufficient.
          if (geoJson) {
            geoJson.features = geoJson.features.filter(
              (f) => f.geometry.type !== "Point"
            );

            let catalogItem = this.terria.getModelById(
              GeoJsonCatalogItem,
              GlobeOrMap.featureHighlightID
            );
            if (catalogItem === undefined) {
              catalogItem = new GeoJsonCatalogItem(
                GlobeOrMap.featureHighlightID,
                this.terria
              );
              catalogItem.setTrait(
                CommonStrata.definition,
                "name",
                GlobeOrMap._featureHighlightName
              );
              this.terria.addModel(catalogItem);
            }

            catalogItem.setTrait(
              CommonStrata.user,
              "geoJsonData",
              <any>geoJson
            );

            catalogItem.setTrait(
              CommonStrata.user,
              "useOutlineColorForLineFeatures",
              true
            );

            catalogItem.setTrait(
              CommonStrata.user,
              "defaultStyle",
              createStratumInstance(TableStyleTraits, {
                outline: createStratumInstance(TableOutlineStyleTraits, {
                  null: createStratumInstance(OutlineSymbolTraits, {
                    width: 4,
                    color: this.terria.baseMapContrastColor
                  })
                }),
                color: createStratumInstance(TableColorStyleTraits, {
                  nullColor: "rgba(0,0,0,0)"
                })
              })
            );

            this.terria.overlays.add(catalogItem);
            this._highlightPromise = catalogItem.loadMapItems();

            const removeCallback = (this._removeHighlightCallback = () => {
              if (!isDefined(this._highlightPromise)) {
                return;
              }
              return this._highlightPromise
                .then(() => {
                  if (removeCallback !== this._removeHighlightCallback) {
                    return;
                  }
                  if (isDefined(catalogItem)) {
                    catalogItem.setTrait(CommonStrata.user, "show", false);
                  }
                })
                .catch(function () {});
            });

            (await catalogItem.loadMapItems()).logError(
              "Error occurred while loading picked feature"
            );

            // Check to make sure we don't have a different `catalogItem` after loading
            if (removeCallback !== this._removeHighlightCallback) {
              return;
            }

            catalogItem.setTrait(CommonStrata.user, "show", true);

            this._highlightPromise = this.terria.overlays
              .add(catalogItem)
              .then((r) => r.throwIfError());
          }
        }
      }
    }
  }

  /**
   * Captures a screenshot of the map.
   * @return A promise that resolves to a data URL when the screenshot is ready.
   */
  captureScreenshot(): Promise<string> {
    throw new DeveloperError(
      "captureScreenshot must be implemented in the derived class."
    );
  }
}
