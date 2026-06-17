import { StyleMapType } from "../../../Table/TableStyleMap";
import objectArrayTrait from "../../Decorators/objectArrayTrait";
import objectTrait from "../../Decorators/objectTrait";
import primitiveArrayTrait from "../../Decorators/primitiveArrayTrait";
import primitiveTrait from "../../Decorators/primitiveTrait";
import ModelTraits from "../../ModelTraits";
import LegendTraits from "../LegendTraits";

export class EnumColorTraits extends ModelTraits {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "string"
  })
  value?: string;

  @primitiveTrait({
    name: "Color",
    description: "The CSS color to use for the enumerated value.",
    type: "string"
  })
  color?: string;
}

export default class TableColorStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Style map type",
    description:
      'The type of style map. Valid values are "continuous", "enum", "bin", "constant"',
    type: "string"
  })
  mapType: StyleMapType | undefined = undefined;

  @primitiveTrait({
    name: "Color Column",
    description: "The column to use to color points or regions.",
    type: "string"
  })
  colorColumn?: string;

  @primitiveTrait({
    name: "Null Color",
    description:
      "The color to use when the value is null, specified as a CSS color string.",
    type: "string"
  })
  nullColor?: string;

  @primitiveTrait({
    name: "Outlier Color",
    description:
      "The color to use when the value is lies outside minimumValue and maximumValue (and therefore not shown on color scale), specified as a CSS color string. This only applies to ContinuousColorMap",
    type: "string"
  })
  outlierColor?: string;

  @primitiveTrait({
    name: "Region Color",
    description:
      "The color to use when the styling the region, specified as a CSS color string.",
    type: "string"
  })
  regionColor: string = "#02528d";

  @primitiveTrait({
    name: "Null Label",
    description: "The label to use in the legend for null values.",
    type: "string"
  })
  nullLabel?: string;

  @primitiveTrait({
    name: "Outlier Label",
    description: "The label to use in the legend for outlier values.",
    type: "string"
  })
  outlierLabel?: string;

  // @primitiveTrait({
  //   name: "Bin Method",
  //   description:
  //     "The method for quantizing color. For numeric columns, valid values are:\n\n" +
  //     "  * `auto` (default)\n" +
  //     "  * `ckmeans`\n" +
  //     "  * `quantile`\n" +
  //     "  * `none` (equivalent to `Number of Bins`=0)\n\n" +
  //     "For enumerated columns, valid values are:\n\n" +
  //     "  * `auto` (default)\n" +
  //     "  * `top`\n" +
  //     "  * `cycle`",
  //   type: "string"
  // })
  // binMethod: string = "auto";

  @primitiveTrait({
    name: "Minimum value",
    description:
      "The minimum value to use when creating ColorMaps. This is only applied for `scalar` columns.",
    type: "number"
  })
  minimumValue?: number;

  @primitiveTrait({
    name: "Maximum value",
    description:
      "The maximum value to use when creating ColorMaps. This is only applied for `scalar` columns.",
    type: "number"
  })
  maximumValue?: number;

  @primitiveTrait({
    name: "Number of Bins",
    description:
      "The number of different colors to bin the data into. This property " +
      "is ignored if `Bin Maximums` is specified for a `scalar` column or " +
      "`Enum Colors` is specified for an `enum` column.",
    type: "number"
  })
  numberOfBins: number = 0;

  @primitiveArrayTrait({
    name: "Bin Maximums",
    description:
      "The maximum values of the bins to bin the data into, specified as an " +
      "array of numbers. The first bin extends from the dataset's minimum " +
      "value to the first value in this array. The second bin extends " +
      "from the first value in this array to the second value in this " +
      "array. And so on. If the maximum value of the dataset is greater " +
      "than the last value in this array, an additional bin is added " +
      "automatically. This property is ignored if the `Color Column` " +
      "is not a scalar.",
    type: "number"
  })
  binMaximums?: number[];

  @primitiveArrayTrait({
    name: "Bin Colors",
    description:
      "The colors to use for the bins, each specified as a CSS color " +
      "string. If there are more colors than bins, the extra colors are " +
      "ignored. If there are more bins than colors, the colors are repeated " +
      "as necessary.",
    type: "string"
  })
  binColors?: string[];

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: EnumColorTraits,
    idProperty: "value"
  })
  enumColors?: EnumColorTraits[];

  @primitiveTrait({
    name: "Color Palette",
    description: `The name of a [ColorBrewer](http://colorbrewer2.org/) palette to use when mapping values to colors. This property is ignored if \`Bin Colors\` is defined and has enough colors for all bins, or if \`Enum Colors\` is defined. The default value depends on the type of the \`Color Column\` and on the data. Scalar columns that cross zero will use the diverging purple-to-orange palette \`PuOr\`. Scala columns that do not cross zero will use the sequential Red palette \`Reds\`. All other scenarios will use the 21 color \`HighContrast\` palette.
      D3 color schemes are also supported (https://github.com/d3/d3-scale-chromatic) - but without \`scheme\` or \`interpolate\` string (for example - to use \`interpolateViridis\` - set \`colorPalette = Viridis\`).
      This is case sensitive.
      `,
    type: "string"
  })
  colorPalette?: string;

  @primitiveTrait({
    name: "Legend Ticks",
    description:
      "The number of tick marks (in addition to the top and bottom) to show on the legend for Continuous color scales",
    type: "number"
  })
  legendTicks: number = 7;

  @objectTrait({
    name: "Legend",
    description:
      "The legend to show with this style. If not specified, a suitable " +
      "is created automatically from the other parameters.",
    type: LegendTraits
  })
  legend?: LegendTraits;

  @primitiveTrait({
    name: "Z-score filter",
    description:
      "Treat values outside of specified z-score as outliers, and therefore do not include in color scale. This value is magnitude of z-score - it will apply to positive and negative z-scores. For example a value of `2` will treat all values that are 2 or more standard deviations from the mean as outliers. This must be defined for it to be enabled. This will be ignored if `minimumValue` or `maximumValue` have been set",
    type: "number"
  })
  zScoreFilter?: number;

  @primitiveTrait({
    name: "Z-score filter enabled",
    description: "True, if z-score filter is enabled.",
    type: "boolean"
  })
  zScoreFilterEnabled: boolean = false;

  @primitiveTrait({
    name: "Range filter",
    description:
      "This is applied after the `zScoreFilter`. It is used to effectively 'disable' the zScoreFilter if it doesn't cut at least the specified percentage of the range of values (for both minimum and maximum value). For example if `rangeFilter = 0.2`, then the zScoreFilter will only be effective if it cuts at least 20% of the range of values from the minimum and maximum value",
    type: "number"
  })
  rangeFilter: number = 0.3;
}
