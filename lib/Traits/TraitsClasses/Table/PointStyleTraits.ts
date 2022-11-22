import { TableStyleMapModel } from "../../../Table/TableStyleMap";
import objectArrayTrait from "../../Decorators/objectArrayTrait";
import objectTrait from "../../Decorators/objectTrait";
import primitiveArrayTrait from "../../Decorators/primitiveArrayTrait";
import primitiveTrait from "../../Decorators/primitiveTrait";
import mixTraits from "../../mixTraits";
import {
  BinStyleTraits,
  EnumStyleTraits,
  TableStyleMapSymbolTraits,
  TableStyleMapTraits
} from "./StyleMapTraits";

export class PointSymbolTraits extends mixTraits(TableStyleMapSymbolTraits) {
  @primitiveTrait({
    name: "Marker (icon)",
    description:
      'Marker used to symbolize points. Default is "point"/"circle". This can be data URI or one of the supported [Maki icons](https://labs.mapbox.com/maki-icons/) (eg "hospital")',
    type: "string"
  })
  marker?: string = "point";

  @primitiveTrait({
    name: "Rotation",
    description: "Rotation of marker in degrees (clockwise).",
    type: "number"
  })
  rotation?: number = 0;

  @primitiveArrayTrait({
    name: "Pixel offset",
    description: "Pixel offset in screen space from the origin. [x, y] format",
    type: "number"
  })
  pixelOffset?: number[];

  @primitiveTrait({
    name: "Height",
    description: "Height of the marker (in pixels).",
    type: "number"
  })
  height?: number = 16;

  @primitiveTrait({
    name: "Width",
    description: "Width of the marker (in pixels).",
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
    name: "Enum point styles",
    description: "The point style to use for enumerated values.",
    type: EnumPointSymbolTraits,
    idProperty: "index"
  })
  enum: EnumPointSymbolTraits[] = [];

  @objectArrayTrait({
    name: "Bin point styles",
    description: "The point style to use for bin values.",
    type: BinPointSymbolTraits,
    idProperty: "index"
  })
  bin: BinPointSymbolTraits[] = [];

  @objectTrait({
    name: "Enum Colors",
    description: "The default point style.",
    type: PointSymbolTraits
  })
  null: PointSymbolTraits = new PointSymbolTraits();
}
