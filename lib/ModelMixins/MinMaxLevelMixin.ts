import { observable } from "mobx";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import Model from "../Models/Definition/Model";
import { scaleDenominatorToLevel } from "./../Core/scaleToDenominator";
import CommonStrata from "./../Models/Definition/CommonStrata";
import { MinMaxLevelTraits } from "./../Traits/TraitsClasses/MinMaxLevelTraits";

function MinMaxLevelMixin<T extends Constructor<Model<MinMaxLevelTraits>>>(
  Base: T
) {
  abstract class MinMaxLevelMixin extends Base {
    @observable notVisible: boolean = false;

    get supportsMinMaxLevel() {
      return true;
    }

    getMinimumLevel(ows: boolean) {
      return scaleDenominatorToLevel(this.maxScaleDenominator, true, ows);
    }

    getMaximumLevel(ows: boolean) {
      return scaleDenominatorToLevel(this.minScaleDenominator, false, ows);
    }

    protected updateRequestImage<T extends ImageryProvider>(
      imageryProvider: T,
      ows: boolean = true
    ) {
      const maximumLevel = this.getMaximumLevel(ows);
      const minimumLevel = this.getMinimumLevel(ows);
      const realRequestImage = imageryProvider.requestImage;
      if (
        (isDefined(maximumLevel) && this.hideLayerAfterMinScaleDenominator) ||
        isDefined(minimumLevel)
      ) {
        imageryProvider.requestImage = (
          x: number,
          y: number,
          level: number
        ) => {
          if (
            (maximumLevel && level > maximumLevel) ||
            (minimumLevel && level < minimumLevel)
          ) {
            if (isDefined((<any>imageryProvider).enablePickFeatures)) {
              (<any>imageryProvider).enablePickFeatures = false;
            }
            if (
              maximumLevel &&
              level > maximumLevel &&
              this.hideLayerAfterMinScaleDenominator
            ) {
              this.setTrait(
                CommonStrata.defaults,
                "scaleWorkbenchInfo",
                "translate#models.scaleDatasetNotVisible.scaleZoomOut"
              );
            } else if (minimumLevel && level < minimumLevel) {
              this.setTrait(
                CommonStrata.defaults,
                "scaleWorkbenchInfo",
                "translate#models.scaleDatasetNotVisible.scaleZoomIn"
              );
            }
            return ImageryProvider.loadImage(
              imageryProvider,
              `${this.terria.baseUrl}images/blank.png`
            );
          }

          this.setTrait(CommonStrata.defaults, "scaleWorkbenchInfo", undefined);
          if (isDefined((<any>imageryProvider).enablePickFeatures)) {
            (<any>imageryProvider).enablePickFeatures = true;
          }
          return realRequestImage.call(imageryProvider, x, y, level);
        };
      }
      return imageryProvider;
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
