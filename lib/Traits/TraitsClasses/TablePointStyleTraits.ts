import StratumFromTraits from "../../Models/Definition/StratumFromTraits";
import { StyleMapType, TableStyleMapModel } from "../../Table/TableStyleMap";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";

export class BinStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "number",
    isNullable: true
  })
  maxValue?: number | null;

  static isRemoval(style: StratumFromTraits<BinStyleTraits>) {
    return style.maxValue === null;
  }
}
export class EnumStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "string",
    isNullable: true
  })
  value?: string | null;

  static isRemoval(style: StratumFromTraits<EnumStyleTraits>) {
    return style.value === null;
  }
}

export class TableStyleMapTraits extends ModelTraits {
  @primitiveTrait({
    name: "Style map type",
    description:
      'The type of style map. Valid values are "continuous", "enum", "bin", "constant"',
    type: "string"
  })
  mapType: StyleMapType | undefined = undefined;

  @primitiveTrait({
    name: "Color Column",
    description: "The column to use for styling.",
    type: "string"
  })
  column: string | undefined = undefined;
}

export class TableStyleMapSymbolTraits extends ModelTraits {
  @primitiveTrait({
    name: "Value",
    description: "The enumerated value to map to a color.",
    type: "string"
  })
  legendTitle?: string;
}

export class PointSymbolTraits extends mixTraits(TableStyleMapSymbolTraits) {
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

export class EnumPointSymbolTraits extends mixTraits(
  PointSymbolTraits,
  EnumStyleTraits
) {
  static isRemoval(style: StratumFromTraits<EnumStyleTraits>) {
    return style.value === null;
  }
}

export class BinPointSymbolTraits extends mixTraits(
  PointSymbolTraits,
  BinStyleTraits
) {
  static isRemoval(style: StratumFromTraits<BinStyleTraits>) {
    return style.maxValue === null;
  }
}

export default class TablePointStyleTraits
  extends mixTraits(TableStyleMapTraits)
  implements TableStyleMapModel<PointSymbolTraits> {
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
