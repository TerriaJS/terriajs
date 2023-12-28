import StratumFromTraits from "../../../Models/Definition/StratumFromTraits";
import { StyleMapType } from "../../../Table/TableStyleMap";
import primitiveTrait from "../../Decorators/primitiveTrait";
import ModelTraits from "../../ModelTraits";

export class BinStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Value",
    description: "The maximum value of the bin for a given style.",
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
    description: "The enumerated value to map to a style.",
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
    name: "Enabled",
    description: "True to enable.",
    type: "boolean"
  })
  enabled = true;

  @primitiveTrait({
    name: "Style map type",
    description:
      'The type of style map. Valid values are "continuous", "enum", "bin", "constant"',
    type: "string"
  })
  mapType: StyleMapType | undefined = undefined;

  @primitiveTrait({
    name: "Column",
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
