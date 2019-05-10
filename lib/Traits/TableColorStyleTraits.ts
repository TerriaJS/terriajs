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
    name: "Null Color",
    description: "The label to use in the legend for null values.",
    type: "string"
  })
  nullLabel?: string;

  @primitiveTrait({
    name: "Color Bin Method",
    description:
      "The method for quantizing color. For numeric columns, valid values are:\n\n" +
      "  * `auto` (default)\n" +
      "  * `ckmeans`\n" +
      "  * `quantile`\n" +
      "  * `none` (equivalent to `Color Bins`=0)\n\n" +
      "For enumerated columns, valid values are:\n\n" +
      "  * `auto` (default)\n" +
      "  * `top`\n" +
      "  * `cycle`",
    type: "string"
  })
  colorBinMethod: string = "auto";

  @primitiveTrait({
    name: "Number of Color Bins",
    description:
      "The number of different colors to bin the data into. This property is ignored if `colorBins` is specified.",
    type: "number"
  })
  numberOfColorBins?: number;

  @primitiveArrayTrait({
    name: "Color Bins",
    description:
      "The color bins to bin the data into, specified as an array " +
      "of numbers. The first bin extends from the dataset's minimum " +
      "value to the first value in this array. The second bin extends " +
      "from the first value in this array to the second value in this " +
      "array. And so on.",
    type: "number"
  })
  colorBins?: number[];

  @primitiveArrayTrait({
    name: "Color Map",
    description:
      "The colors to use for the bins, each specified as a CSS color " +
      "string. If there are more colors than bins, the extra colors are " +
      "ignored. If there are more bins than colors, random colors are " +
      "used for the remaining bins.",
    type: "number"
  })
  colorMap?: string[];

  @primitiveTrait({
    name: "Color Palette",
    description:
      "The name of a [ColorBrewer](http://colorbrewer2.org/) palette to use when mapping values " +
      "to colors. This property is ignored if `Color Map` is defined.",
    type: "string"
  })
  colorPalette?: string;

  @primitiveTrait({
    name: "Legend Ticks",
    description:
      "The number of tick marks (in addition to the top and bottom) to show on the " +
      "legend when the `Color Bin Method` is set to `none` and `Color Bins` is not defined.",
    type: "number"
  })
  legendTicks?: number;
}
