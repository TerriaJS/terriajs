import { BinStyle, EnumStyle } from "../../Table/TableStyleMap";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import StratumFromTraits from "../../Models/Definition/StratumFromTraits";

export class PointSymbolTraits extends ModelTraits {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "string"
  })
  marker: string = "point";

  @primitiveTrait({
    name: "Color",
    description: "The CSS color to use for the enumerated value.",
    type: "number"
  })
  rotation: number = 0;

  @primitiveArrayTrait({
    name: "Color",
    description: "The CSS color to use for the enumerated value.",
    type: "number"
  })
  pixelOffset?: number[];

  @primitiveTrait({
    name: "Color",
    description: "The CSS color to use for the enumerated value.",
    type: "number"
  })
  height: number = 24;

  @primitiveTrait({
    name: "Color",
    description: "The CSS color to use for the enumerated value.",
    type: "number"
  })
  width: number = 24;
}

export class EnumPointSymbolTraits extends mixTraits(PointSymbolTraits)
  implements EnumStyle {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "string",
    isNullable: true
  })
  value?: string | null;

  static isRemoval(style: StratumFromTraits<EnumPointSymbolTraits>) {
    return style.value === null;
  }
}

export class BinPointSymbolTraits extends mixTraits(PointSymbolTraits)
  implements BinStyle {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "number",
    isNullable: true
  })
  maxValue?: number | null;
}

export default class TablePointStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Color Column",
    description: "The column to use to color points or regions.",
    type: "string"
  })
  column?: string;

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: EnumPointSymbolTraits,
    idProperty: "index"
  })
  enum?: EnumPointSymbolTraits[];

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: BinPointSymbolTraits,
    idProperty: "index"
  })
  bin?: BinPointSymbolTraits[];

  @objectTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: PointSymbolTraits
  })
  null?: PointSymbolTraits;

  // @objectTrait({
  //   name: "Legend",
  //   description:
  //     "The legend to show with this style. If not specified, a suitable " +
  //     "is created automatically from the other parameters.",
  //   type: LegendTraits
  // })
  // legend?: LegendTraits;
}
