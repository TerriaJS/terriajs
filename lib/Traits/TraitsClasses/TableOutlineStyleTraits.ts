import { TableStyleMapModel } from "../../Table/TableStyleMap";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import {
  BinStyleTraits,
  EnumStyleTraits,
  TableStyleMapSymbolTraits,
  TableStyleMapTraits
} from "./TableStyleMapTraits";

export class OutlineSymbolTraits extends mixTraits(TableStyleMapSymbolTraits) {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "string"
  })
  color?: string;

  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "number"
  })
  width?: number = 1;
}

export class EnumOutlineSymbolTraits extends mixTraits(
  OutlineSymbolTraits,
  EnumStyleTraits
) {
  static isRemoval = EnumStyleTraits.isRemoval;
}

export class BinOutlineSymbolTraits extends mixTraits(
  OutlineSymbolTraits,
  BinStyleTraits
) {
  static isRemoval = BinStyleTraits.isRemoval;
}

export default class TableOutlineStyleTraits
  extends mixTraits(TableStyleMapTraits)
  implements TableStyleMapModel<OutlineSymbolTraits>
{
  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: EnumOutlineSymbolTraits,
    idProperty: "value"
  })
  enum: EnumOutlineSymbolTraits[] = [];

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: BinOutlineSymbolTraits,
    idProperty: "index"
  })
  bin: BinOutlineSymbolTraits[] = [];

  @objectTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: OutlineSymbolTraits
  })
  null = new OutlineSymbolTraits();
}
