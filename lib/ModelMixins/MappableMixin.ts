import i18next from "i18next";
import { computed, makeObservable, observable, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import TerrainProvider from "terriajs-cesium/Source/Core/TerrainProvider";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import AbstractConstructor from "../Core/AbstractConstructor";
import AsyncLoader from "../Core/AsyncLoader";
import Result from "../Core/Result";
import Model from "../Models/Definition/Model";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import CatalogMemberMixin, { getName } from "./CatalogMemberMixin";

// Unfortunately Cesium does not declare a single interface that represents a primitive,
// but here is what primitives have in common:
export interface AbstractPrimitive {
  show: boolean;
  destroy(): void;
  isDestroyed(): boolean;
}

export type MapItem =
  | ImageryParts
  | DataSource
  | AbstractPrimitive
  | TerrainProvider;

export class ImageryParts {
  @observable imageryProvider: ImageryProvider | undefined = undefined;
  alpha: number = 0.8;
  clippingRectangle: Rectangle | undefined = undefined;
  show: boolean = true;

  /*
   * An optional method that returns an ImageryProvider instance for the
   *  preview map which may use a CRS and tiling scheme different to the
   *  default imageryprovider used for the main map.
   *
   * This is currently only used by plugins to customize preview map behaviour.
   * (eg terriajs-plugin-proj4leaflet)
   */
  previewImageryProvider?: (crs: string) => ImageryProvider | undefined;

  static fromAsync(options: {
    imageryProviderPromise: Promise<ImageryProvider | undefined>;
    alpha?: number;
    clippingRectangle?: Rectangle;
    show?: boolean;
  }): ImageryParts {
    const result = new ImageryParts({
      imageryProvider: undefined,
      alpha: options.alpha,
      clippingRectangle: options.clippingRectangle,
      show: options.show
    });
    options.imageryProviderPromise.then((imageryProvider) => {
      if (imageryProvider) {
        runInAction(() => {
          result.imageryProvider = imageryProvider;
        });
      }
    });
    return result;
  }

  constructor(options: {
    imageryProvider: ImageryProvider | undefined;
    alpha?: number;
    clippingRectangle?: Rectangle;
    show?: boolean;
  }) {
    this.imageryProvider = options.imageryProvider;
    this.alpha = options.alpha ?? 0.8;
    this.clippingRectangle = options.clippingRectangle;
    this.show = options.show ?? true;
  }
}

// This discriminator only discriminates between ImageryParts and DataSource
export namespace ImageryParts {
  export function is(object: MapItem): object is ImageryParts {
    return "imageryProvider" in object;
  }
}

export function isPrimitive(mapItem: MapItem): mapItem is AbstractPrimitive {
  return "isDestroyed" in mapItem;
}

export function isCesium3DTileset(
  mapItem: MapItem
): mapItem is Cesium3DTileset {
  return "allTilesLoaded" in mapItem;
}

export function isTerrainProvider(
  mapItem: MapItem
): mapItem is TerrainProvider {
  return "hasVertexNormals" in mapItem;
}

export function isDataSource(object: MapItem): object is DataSource {
  return "entities" in object;
}

type BaseType = Model<MappableTraits>;

function MappableMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class MappableMixin extends Base {
    initialMessageShown: boolean = false;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    get isMappable() {
      return true;
    }

    @computed
    get cesiumRectangle() {
      if (
        this.rectangle !== undefined &&
        this.rectangle.east !== undefined &&
        this.rectangle.west !== undefined &&
        this.rectangle.north !== undefined &&
        this.rectangle.south !== undefined
      ) {
        return Rectangle.fromDegrees(
          this.rectangle.west,
          this.rectangle.south,
          this.rectangle.east,
          this.rectangle.north
        );
      }
      return undefined;
    }

    get shouldShowInitialMessage(): boolean {
      if (this.initialMessage !== undefined) {
        const hasTitle =
          this.initialMessage.title !== undefined &&
          this.initialMessage.title !== "" &&
          this.initialMessage.title !== null;
        const hasContent =
          this.initialMessage.content !== undefined &&
          this.initialMessage.content !== "" &&
          this.initialMessage.content !== null;
        return (hasTitle || hasContent) && !this.initialMessageShown;
      }
      return false;
    }

    private _mapItemsLoader = new AsyncLoader(
      this.forceLoadMapItems.bind(this)
    );

    get loadMapItemsResult() {
      return this._mapItemsLoader.result;
    }

    /**
     * Gets a value indicating whether map items are currently loading.
     */
    get isLoadingMapItems(): boolean {
      return this._mapItemsLoader.isLoading;
    }

    /**
     * Loads the map items. It is safe to call this as often as necessary.
     * This will also call `loadMetadata()`.
     * If the map items are already loaded or already loading, it will
     * return the existing promise.
     *
     * This returns a Result object, it will contain errors if they occur - they will not be thrown.
     * To throw errors, use `(await loadMetadata()).throwIfError()`
     *
     * {@see AsyncLoader}
     */
    async loadMapItems(force?: boolean): Promise<Result<void>> {
      try {
        if (CatalogMemberMixin.isMixedInto(this))
          (await this.loadMetadata()).throwIfError();

        (await this._mapItemsLoader.load(force)).throwIfError();
      } catch (e) {
        return Result.error(e, {
          message: `Failed to load \`${getName(this)}\` mapItems`,
          importance: -1
        });
      }

      return Result.none();
    }

    /**
     * Forces load of the maps items. This method does _not_ need to consider
     * whether the map items are already loaded.
     *
     * It is guaranteed that `loadMetadata` has finished before this is called.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}.
     *
     * Errors can be thrown here.
     *
     * {@see AsyncLoader}
     */
    protected abstract forceLoadMapItems(): Promise<void>;

    /**
     * Array of MapItems to show on the map/chart when Catalog Member is shown
     */
    abstract get mapItems(): MapItem[];

    showInitialMessage(): Promise<void> {
      // This function is deliberately not a computed,
      // this.terria.notificationState.addNotificationToQueue changes state
      this.initialMessageShown = true;
      return new Promise((resolve) => {
        this.terria.notificationState.addNotificationToQueue({
          title: this.initialMessage.title ?? i18next.t("notification.title"),
          width: this.initialMessage.width,
          height: this.initialMessage.height,
          confirmText: this.initialMessage.confirmation
            ? this.initialMessage.confirmText
            : undefined,
          message: this.initialMessage.content ?? "",
          key: "initialMessage:" + this.initialMessage.key,
          confirmAction: () => resolve(),
          showAsToast: this.initialMessage.showAsToast,
          toastVisibleDuration: this.initialMessage.toastVisibleDuration
        });

        // No need to wait for confirmation if the message is a toast
        if (this.initialMessage.showAsToast) {
          resolve();
        }
      });
    }

    dispose() {
      super.dispose();
      this._mapItemsLoader.dispose();
    }
  }

  return MappableMixin;
}

namespace MappableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof MappableMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return (
      model &&
      model.isMappable &&
      "forceLoadMapItems" in model &&
      typeof model.forceLoadMapItems === "function"
    );
  }
}

export default MappableMixin;
