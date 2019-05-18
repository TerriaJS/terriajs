import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import ModelTraits from "./ModelTraits";
import primitiveArrayTrait from "./primitiveArrayTrait";
import primitiveTrait from "./primitiveTrait";

export default class TableColorStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Color Column",
    description: "The column to use to color points or regions.",
    type: "string"
  })
  colorColumn?: string;

  @primitiveTrait({
    name: "Minimum Display Value",
    description:
      "The minimum value to use for coloring. Any row with a value less than this will be shown as if it had this value.",
    type: "number"
  })
  minimumDisplayValue?: number;

  @primitiveTrait({
    name: "Maximum Display Value",
    description:
      "The maximum value to use for coloring. Any row with a value greater than this will be shown as if it had this value.",
    type: "number"
  })
  maximumDisplayValue?: number;

  @primitiveTrait({
    name: "Null Color",
    description:
      "The color to use when the value is null, specified as a CSS color string.",
    type: "string"
  })
  nullColor?: string;

  @primitiveTrait({
    name: "Null Label",
    description: "The label to use in the legend for null values.",
    type: "string"
  })
  nullLabel?: string;

  @primitiveTrait({
    name: "Bin Method",
    description:
      "The method for quantizing color. For numeric columns, valid values are:\n\n" +
      "  * `auto` (default)\n" +
      "  * `ckmeans`\n" +
      "  * `quantile`\n" +
      "  * `none` (equivalent to `Number of Bins`=0)\n\n" +
      "For enumerated columns, valid values are:\n\n" +
      "  * `auto` (default)\n" +
      "  * `top`\n" +
      "  * `cycle`",
    type: "string"
  })
  binMethod: string = "auto";

  @primitiveTrait({
    name: "Number of Bins",
    description:
      "The number of different colors to bin the data into. This property is ignored if `Bin Maximums` is specified.",
    type: "number"
  })
  numberOfBins: number = 7;

  @primitiveArrayTrait({
    name: "Bin Maximums",
    description:
      "The maximum values of the bins to bin the data into, specified as an " +
      "array of numbers. The first bin extends from the dataset's minimum " +
      "value to the first value in this array. The second bin extends " +
      "from the first value in this array to the second value in this " +
      "array. And so on. If the maximum value of the dataset is greater " +
      "than the last value in this array, an additional bin is added " +
      "automatically.",
    type: "number"
  })
  binMaximums?: number[];

  @primitiveArrayTrait({
    name: "Bin Colors",
    description:
      "The colors to use for the bins, each specified as CSS color " +
      "strings. If there are more colors than bins, the extra colors are " +
      "ignored. If there are more bins than colors, `Color Palette` or " +
      "a default color is used for the remaining bins.",
    type: "number"
  })
  binColors?: string[];

  @primitiveTrait({
    name: "Color Palette",
    description:
      "The name of a [ColorBrewer](http://colorbrewer2.org/) palette to use when mapping values " +
      "to colors. This property is ignored if `Bin Colors` is defined and has enough colors for " +
      "all bins.",
    type: "string"
  })
  colorPalette: string = "YlOrRd";

  @primitiveTrait({
    name: "Legend Ticks",
    description:
      "The number of tick marks (in addition to the top and bottom) to show on the " +
      "legend when the `Color Bin Method` is set to `none` and `Color Bins` is not defined.",
    type: "number"
  })
  legendTicks?: number;
}
