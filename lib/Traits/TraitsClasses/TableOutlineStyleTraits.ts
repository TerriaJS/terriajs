import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import { BinStyleTraits, EnumStyleTraits } from "./TableStyleTraits";

export class OutlineSymbolTraits extends ModelTraits {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "string"
  })
  color?: string;

  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "string"
  })
  style: "solid" | "dash" = "solid";

  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "number"
  })
  width: number = 1;
}

export class EnumOutlineSymbolTraits extends mixTraits(
  OutlineSymbolTraits,
  EnumStyleTraits
) {}

export class BinOutlineSymbolTraits extends mixTraits(
  OutlineSymbolTraits,
  BinStyleTraits
) {}

export default class TableOutlineStyleTraits extends ModelTraits {
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
    type: EnumOutlineSymbolTraits,
    idProperty: "value"
  })
  enum?: EnumOutlineSymbolTraits[];

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: BinOutlineSymbolTraits,
    idProperty: "index"
  })
  bin?: BinOutlineSymbolTraits[];

  @objectTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: OutlineSymbolTraits
  })
  null?: OutlineSymbolTraits;

  // @objectTrait({
  //   name: "Legend",
  //   description:
  //     "The legend to show with this style. If not specified, a suitable " +
  //     "is created automatically from the other parameters.",
  //   type: LegendTraits
  // })
  // legend?: LegendTraits;
}
