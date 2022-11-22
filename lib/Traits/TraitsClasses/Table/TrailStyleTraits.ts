import { TableStyleMapModel } from "../../../Table/TableStyleMap";
import objectArrayTrait from "../../Decorators/objectArrayTrait";
import objectTrait from "../../Decorators/objectTrait";
import primitiveTrait from "../../Decorators/primitiveTrait";
import mixTraits from "../../mixTraits";
import ModelTraits from "../../ModelTraits";
import {
  BinStyleTraits,
  EnumStyleTraits,
  TableStyleMapSymbolTraits,
  TableStyleMapTraits
} from "./StyleMapTraits";

/** Supports CZML SolidColorMaterial https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/SolidColorMaterial */
export class SolidColorMaterialTraits extends ModelTraits {
  @primitiveTrait({
    name: "Color",
    description: "The color.",
    type: "string"
  })
  color = "#ffffff";
}

/** Supports CZML PolylineGlowMaterial https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/PolylineGlowMaterial */
export class PolylineGlowMaterialTraits extends ModelTraits {
  @primitiveTrait({
    name: "Color",
    description: "The color.",
    type: "string"
  })
  color = "#ffffff";

  @primitiveTrait({
    name: "Glow power",
    description:
      "The strength of the glow, as a percentage of the total line width.",
    type: "number"
  })
  glowPower = 0.25;

  @primitiveTrait({
    name: "Glow taper power",
    description:
      "The strength of the glow tapering effect, as a percentage of the total line length. If 1.0 or higher, no taper effect is used.",
    type: "number"
  })
  taperPower = 1;
}

/** Supports subset of CZML PolylineMaterial https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/PolylineMaterial
 *
 * Unimplemented materials
 * - polylineOutline
 * - polylineArrow
 * - polylineDash
 * - image
 * - grid
 * - stripe
 * - checkerboard
 */
export class PolylineMaterialTraits extends ModelTraits {
  @objectTrait({
    type: PolylineGlowMaterialTraits,
    name: "Polyline glow material",
    description:
      'Polyline glow material. Must also set `materialType = "polylineGlow"`'
  })
  polylineGlow?: PolylineGlowMaterialTraits;

  @objectTrait({
    type: SolidColorMaterialTraits,
    name: "Solid color material",
    description: "Solid color material."
  })
  solidColor?: SolidColorMaterialTraits;
}

/** Supports subset of CZML Path https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/Path
 *
 * Unimplemented properties
 * - show
 * - distanceDisplayCondition
 *
 * Note: materials is handled slightly differently
 */
export class TrailSymbolTraits extends mixTraits(
  PolylineMaterialTraits,
  TableStyleMapSymbolTraits
) {
  @primitiveTrait({
    name: "Lead time",
    description: "The number of seconds in front of the object to show.",
    type: "number"
  })
  leadTime = 0;

  @primitiveTrait({
    name: "Trail time",
    description: "The number of seconds behind the object to show.",
    type: "number"
  })
  trailTime = 10;

  @primitiveTrait({
    name: "Width",
    description: "The width in pixels.",
    type: "number"
  })
  width = 1;

  @primitiveTrait({
    name: "Resolution",
    description:
      "The maximum number of seconds to step when sampling the position.",
    type: "number"
  })
  resolution: number = 60;
}

export class EnumTrailSymbolTraits extends mixTraits(
  TrailSymbolTraits,
  EnumStyleTraits
) {
  static isRemoval = EnumStyleTraits.isRemoval;
}

export class BinTrailSymbolTraits extends mixTraits(
  TrailSymbolTraits,
  BinStyleTraits
) {
  static isRemoval = BinStyleTraits.isRemoval;
}

export default class TableTrailStyleTraits
  extends mixTraits(TableStyleMapTraits)
  implements TableStyleMapModel<TrailSymbolTraits>
{
  // Override TableStyleMapTraits.enabled default
  @primitiveTrait({
    name: "Enabled",
    description: "True to enable. False by default",
    type: "boolean"
  })
  enabled = false;

  @primitiveTrait({
    name: "Material type",
    description:
      "The type of material to use. Possible values: `solidColor` and `polylineGlow`. Default is `solidColor`",
    type: "string"
  })
  materialType?: keyof PolylineMaterialTraits = "solidColor";

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: EnumTrailSymbolTraits,
    idProperty: "value"
  })
  enum: EnumTrailSymbolTraits[] = [];

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: BinTrailSymbolTraits,
    idProperty: "index"
  })
  bin: BinTrailSymbolTraits[] = [];

  @objectTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: TrailSymbolTraits
  })
  null = new TrailSymbolTraits();
}
