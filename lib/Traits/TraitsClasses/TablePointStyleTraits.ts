import { TableStyleMapModel } from "../../Table/TableStyleMap";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import {
  BinStyleTraits,
  EnumStyleTraits,
  TableStyleMapSymbolTraits,
  TableStyleMapTraits
} from "./TableStyleMapTraits";

export class PointSymbolTraits extends mixTraits(TableStyleMapSymbolTraits) {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "string"
  })
  marker?: string = "point";

  @primitiveTrait({
    name: "Color",
    description: "The CSS color to use for the enumerated value.",
    type: "number"
  })
  rotation?: number;

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
  height?: number = 16;

  @primitiveTrait({
    name: "Color",
    description: "The CSS color to use for the enumerated value.",
    type: "number"
  })
  width?: number = 16;
}

export class EnumPointSymbolTraits extends mixTraits(
  PointSymbolTraits,
  EnumStyleTraits
) {
  static isRemoval = EnumStyleTraits.isRemoval;
}

export class BinPointSymbolTraits extends mixTraits(
  PointSymbolTraits,
  BinStyleTraits
) {
  static isRemoval = BinStyleTraits.isRemoval;
}

export default class TablePointStyleTraits
  extends mixTraits(TableStyleMapTraits)
  implements TableStyleMapModel<PointSymbolTraits>
{
  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: EnumPointSymbolTraits,
    idProperty: "index"
  })
  enum: EnumPointSymbolTraits[] = [];

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: BinPointSymbolTraits,
    idProperty: "index"
  })
  bin: BinPointSymbolTraits[] = [];

  @objectTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: PointSymbolTraits
  })
  null: PointSymbolTraits = new PointSymbolTraits();
}
