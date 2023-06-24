import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export class MinMaxLevelTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Maximum Scale Denominator",
    description:
      "The denominator of the smallest scale (largest denominator) for which tiles should be requested. " +
      "For example, if this value is 10000, then tiles representing a scale smaller than 1:10000 (i.e. " +
      "numerically larger denominator, when zooming out further) will not be requested. For large scales set " +
      "hideLayerBeforeMaxScaleDenominator to true, otherwise you may experience performance issues (requesting too many tiles)."
  })
  maxScaleDenominator?: number;

  @primitiveTrait({
    type: "number",
    name: "Minimum Scale Denominator",
    description:
      "The denominator of the largest scale (smallest denominator) for which tiles should be requested. " +
      "For example, if this value is 1000, then tiles representing a scale larger than 1:1000 (i.e. " +
      "numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of " +
      "the largest-available scale, as specified by this property, will be used and will simply get " +
      "blurier as the user zooms in closer."
  })
  minScaleDenominator?: number;

  @primitiveTrait({
    type: "boolean",
    name: "Hide Layer After Minimum Scale Denominator",
    description:
      "True to hide tiles when the `Minimum Scale Denominator` is exceeded. If false, we can zoom in arbitrarily close to the (increasingly blurry) layer."
  })
  hideLayerAfterMinScaleDenominator: boolean = false;

  @primitiveTrait({
    type: "string",
    name: "Scale workbench info",
    description:
      "The message to show to the user when this dataset is not visible due to scale."
  })
  scaleWorkbenchInfo?: string;
}
