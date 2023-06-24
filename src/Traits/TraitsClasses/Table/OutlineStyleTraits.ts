import { TableStyleMapModel } from "../../../Table/TableStyleMap";
import objectArrayTrait from "../../Decorators/objectArrayTrait";
import objectTrait from "../../Decorators/objectTrait";
import primitiveTrait from "../../Decorators/primitiveTrait";
import mixTraits from "../../mixTraits";
import {
  BinStyleTraits,
  EnumStyleTraits,
  TableStyleMapSymbolTraits,
  TableStyleMapTraits
} from "./StyleMapTraits";

export class OutlineSymbolTraits extends mixTraits(TableStyleMapSymbolTraits) {
  @primitiveTrait({
    name: "Color",
    description: "Outline color.",
    type: "string"
  })
  color?: string;

  @primitiveTrait({
    name: "Width",
    description: "Outline width (in pixels).",
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
    description: "The outline style to use for enumerated values.",
    type: EnumOutlineSymbolTraits,
    idProperty: "value"
  })
  enum: EnumOutlineSymbolTraits[] = [];

  @objectArrayTrait({
    name: "Enum Colors",
    description: "The outline style to use for bin values.",
    type: BinOutlineSymbolTraits,
    idProperty: "index"
  })
  bin: BinOutlineSymbolTraits[] = [];

  @objectTrait({
    name: "Enum Colors",
    description: "The default outline style.",
    type: OutlineSymbolTraits
  })
  null = new OutlineSymbolTraits();
}
