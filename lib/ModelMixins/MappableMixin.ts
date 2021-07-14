import i18next from "i18next";
import { computed } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import TerrainProvider from "terriajs-cesium/Source/Core/TerrainProvider";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import TableMixin from "./TableMixin";

export type MapItem =
  | ImageryParts
  | DataSource
  | Cesium3DTileset
  | TerrainProvider;

// Shouldn't this be a class?
export interface ImageryParts {
  alpha: number;
  clippingRectangle: Rectangle | undefined;
  imageryProvider: ImageryProvider;
  show: boolean;
}

// This discriminator only discriminates between ImageryParts and DataSource
export namespace ImageryParts {
  export function is(object: MapItem): object is ImageryParts {
    return "imageryProvider" in object;
  }
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

function MappableMixin<T extends Constructor<Model<MappableTraits>>>(Base: T) {
  abstract class MappableMixin extends Base {
    initialMessageShown: boolean = false;
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

    showInitialMessage(): Promise<void> {
      // This function is deliberately not a computed,
      // this.terria.notificationState.addNotificationToQueue changes state
      this.initialMessageShown = true;
      return new Promise(resolve => {
        this.terria.notificationState.addNotificationToQueue({
          title: this.initialMessage.title ?? i18next.t("notification.title"),
          width: this.initialMessage.width,
          height: this.initialMessage.height,
          confirmText: this.initialMessage.confirmation
            ? this.initialMessage.confirmText
            : undefined,
          message: this.initialMessage.content ?? "",
          key: "initialMessage:" + this.initialMessage.key,
          confirmAction: () => resolve()
        });
      });
    }

    private _mapItemsLoader = new AsyncLoader(
      this.forceLoadMapItems.bind(this)
    );

    /**
     * Gets a value indicating whether map items are currently loading.
     */
    get isLoadingMapItems(): boolean {
      return this._mapItemsLoader.isLoading;
    }

    /**
     * Loads the map items. It is safe to call this as often as necessary.
     * If the map items are already loaded or already loading, it will
     * return the existing promise.
     */
    async loadMapItems(force?: boolean) {
      if (this.shouldShowInitialMessage) {
        // Don't await the initialMessage because this causes cyclic dependency between loading
        //  and user interaction (see https://github.com/TerriaJS/terriajs/issues/5528)
        this.showInitialMessage();
      }
      if (CatalogMemberMixin.isMixedInto(this)) await this.loadMetadata();

      // We need to make sure the region provider is loaded before loading
      // region mapped tables.
      if (TableMixin.isMixedInto(this)) await this.loadRegionProviderList();
      await this._mapItemsLoader.load(force);
    }

    abstract get mapItems(): MapItem[];

    /**
     * Forces load of the maps items. This method does _not_ need to consider
     * whether the map items are already loaded.
     *
     * It is guaranteed that `loadMetadata` has finished before this is called.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}.
     */
    protected abstract async forceLoadMapItems(): Promise<void>;

    dispose() {
      super.dispose();
      this._mapItemsLoader.dispose();
    }
  }

  return MappableMixin;
}

namespace MappableMixin {
  export interface MappableMixin
    extends InstanceType<ReturnType<typeof MappableMixin>> {}
  export function isMixedInto(model: any): model is MappableMixin {
    return model && model.isMappable;
  }
}

export default MappableMixin;
