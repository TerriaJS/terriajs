import { observable, makeObservable } from "mobx";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import Request from "terriajs-cesium/Source/Core/Request";
import AbstractConstructor from "../Core/AbstractConstructor";
import isDefined from "../Core/isDefined";
import Model from "../Models/Definition/Model";
import { scaleDenominatorToLevel } from "./../Core/scaleToDenominator";
import CommonStrata from "./../Models/Definition/CommonStrata";
import { MinMaxLevelTraits } from "./../Traits/TraitsClasses/MinMaxLevelTraits";

type BaseType = Model<MinMaxLevelTraits>;

function MinMaxLevelMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class MinMaxLevelMixin extends Base {
    @observable notVisible: boolean = false;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    get supportsMinMaxLevel() {
      return true;
    }

    getMinimumLevel(ows: boolean) {
      return scaleDenominatorToLevel(this.maxScaleDenominator, true, ows);
    }

    getMaximumLevel(ows: boolean) {
      return scaleDenominatorToLevel(this.minScaleDenominator, false, ows);
    }

    private static updateRequestImageInternal<T extends ImageryProvider>(
      mixin: MinMaxLevelMixin,
      imageryProvider: T,
      minimumLevel: number | undefined,
      maximumLevel: number | undefined,
      hideLayerAfterMinScaleDenominator: boolean
    ): T {
      const realRequestImage = imageryProvider.requestImage;
      if (
        (isDefined(maximumLevel) && hideLayerAfterMinScaleDenominator) ||
        isDefined(minimumLevel)
      ) {
        // TODO: The cast is necessary because the type Cesium declares for
        // `requestImage` is incorrect. It is missing `CompressedTextureBuffer`
        // as a possible return type.
        type ExpectedCesiumRequestImageType = (
          x: number,
          y: number,
          level: number,
          request?: Request
        ) =>
          | Promise<HTMLImageElement | HTMLCanvasElement | ImageBitmap>
          | undefined;
        imageryProvider.requestImage = ((
          x: number,
          y: number,
          level: number,
          _request: Request | undefined
        ) => {
          if (
            (maximumLevel && level > maximumLevel) ||
            (minimumLevel && level < minimumLevel)
          ) {
            if (isDefined((imageryProvider as any).enablePickFeatures)) {
              (imageryProvider as any).enablePickFeatures = false;
            }
            if (
              maximumLevel &&
              level > maximumLevel &&
              mixin.hideLayerAfterMinScaleDenominator
            ) {
              mixin.setTrait(
                CommonStrata.defaults,
                "scaleWorkbenchInfo",
                "translate#models.scaleDatasetNotVisible.scaleZoomOut"
              );
            } else if (minimumLevel && level < minimumLevel) {
              mixin.setTrait(
                CommonStrata.defaults,
                "scaleWorkbenchInfo",
                "translate#models.scaleDatasetNotVisible.scaleZoomIn"
              );
            }
            return ImageryProvider.loadImage(
              imageryProvider,
              `${mixin.terria.baseUrl}images/blank.png`
            );
          }

          mixin.setTrait(
            CommonStrata.defaults,
            "scaleWorkbenchInfo",
            undefined
          );
          if (isDefined((imageryProvider as any).enablePickFeatures)) {
            (imageryProvider as any).enablePickFeatures = true;
          }
          return realRequestImage.call(imageryProvider, x, y, level);
        }) as ExpectedCesiumRequestImageType;
      }
      return imageryProvider;
    }

    protected updateRequestImage<T extends ImageryProvider>(
      imageryProvider: T,
      ows: boolean = true
    ): T {
      const maximumLevel = this.getMaximumLevel(ows);
      const minimumLevel = this.getMinimumLevel(ows);
      const hideLayerAfterMinScaleDenominator =
        this.hideLayerAfterMinScaleDenominator;
      return MinMaxLevelMixin.updateRequestImageInternal(
        this,
        imageryProvider,
        minimumLevel,
        maximumLevel,
        hideLayerAfterMinScaleDenominator
      );
    }

    protected updateRequestImageAsync<T extends ImageryProvider>(
      imageryProviderPromise: Promise<T>,
      ows: boolean = true
    ): Promise<T> {
      const maximumLevel = this.getMaximumLevel(ows);
      const minimumLevel = this.getMinimumLevel(ows);
      const hideLayerAfterMinScaleDenominator =
        this.hideLayerAfterMinScaleDenominator;

      return imageryProviderPromise.then((imageryProvider) => {
        return MinMaxLevelMixin.updateRequestImageInternal(
          this,
          imageryProvider,
          minimumLevel,
          maximumLevel,
          hideLayerAfterMinScaleDenominator
        );
      });
    }
  }

  return MinMaxLevelMixin;
}

namespace MinMaxLevelMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof MinMaxLevelMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.supportsMinMaxLevel;
  }
}
export default MinMaxLevelMixin;
