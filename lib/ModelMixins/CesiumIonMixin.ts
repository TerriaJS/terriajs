import { observable, runInAction } from "mobx";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model from "../Models/Definition/Model";
import CatalogMemberTraits from "../Traits/TraitsClasses/CatalogMemberTraits";
import CesiumIonTraits from "../Traits/TraitsClasses/CesiumIonTraits";

type BaseType = Model<CesiumIonTraits & CatalogMemberTraits>;

/**
 * A mixin for a model that can be loaded from Cesium ion via an `ionAssetId`. If an asset ID is supplied,
 * the `ionResource` will be populated asynchronously after `loadIonResource` is called (usually from
 * `forceLoadMetadata`). If defined, the resource in this property should be used as the "URL" given to
 * CesiumJS instead of a regular URL.
 */
export default function CesiumIonMixin<T extends AbstractConstructor<BaseType>>(
  Base: T
) {
  abstract class CesiumIonMixin extends Base {
    /**
     * The {@link IonResource} that can be given to CesiumJS most places that a resource URL can be used.
     */
    @observable
    ionResource: IonResource | undefined = undefined;

    /**
     * Populates the the `ionResource` from the `ionAssetId`, `ionAccessToken`, and `ionServer`
     * traits. This should be called from `forceLoadMetadata`.
     */
    async loadIonResource(): Promise<void> {
      if (this.ionAssetId) {
        const resource = await IonResource.fromAssetId(this.ionAssetId, {
          accessToken: this.ionAccessToken,
          server: this.ionServer
        });

        runInAction(() => {
          this.ionResource = resource;
        });
      } else {
        this.ionResource = undefined;
      }
    }
  }

  return CesiumIonMixin;
}
