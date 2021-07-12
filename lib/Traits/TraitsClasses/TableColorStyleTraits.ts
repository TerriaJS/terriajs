import ModelTraits from "../ModelTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import objectTrait from "../Decorators/objectTrait";
import LegendTraits from "./LegendTraits";

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
    name: "Color Column",
    description: "The column to use to color points or regions.",
    type: "string"
  })
  colorColumn?: string;

  // @primitiveTrait({
  //   name: "Minimum Display Value",
  //   description:
  //     "The minimum value to use for coloring. Any row with a value less than this will be shown as if it had this value.",
  //   type: "number"
  // })
  // minimumDisplayValue?: number;

  // @primitiveTrait({
  //   name: "Maximum Display Value",
  //   description:
  //     "The maximum value to use for coloring. Any row with a value greater than this will be shown as if it had this value.",
  //   type: "number"
  // })
  // maximumDisplayValue?: number;

  @primitiveTrait({
    name: "Null Color",
    description:
      "The color to use when the value is null, specified as a CSS color string.",
    type: "string"
  })
  nullColor?: string;

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
      D3 color schemes are also supported (https://github.com/d3/d3-scale-chromatic) - but without \`scheme\` or \`interpolate\` string (for example - to use \`interpolateViridis\` - set \`colorPalete = Viridis\`).
      This is case seensitive.
      `,
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

  @objectTrait({
    name: "Legend",
    description:
      "The legend to show with this style. If not specified, a suitable " +
      "is created automatically from the other parameters.",
    type: LegendTraits
  })
  legend?: LegendTraits;
}
