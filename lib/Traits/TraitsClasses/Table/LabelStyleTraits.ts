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

/** Supports subset of CZML Label https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/Label
 *
 * Unimplemented properties
 * - show
 * - eyeOffset
 * - horizontalOrigin
 * - verticalOrigin
 * - heightReference
 * - showBackground
 * - backgroundColor
 * - backgroundPadding
 * - translucencyByDistance
 * - pixelOffsetScaleByDistance
 * - scaleByDistance
 * - distanceDisplayCondition
 * - disableDepthTestDistance

 */
export class LabelSymbolTraits extends mixTraits(TableStyleMapSymbolTraits) {
  @primitiveTrait({
    name: "Label column",
    description: "ID of column to use as label",
    type: "string"
  })
  labelColumn?: string;

  @primitiveTrait({
    name: "Font",
    description: "Font CSS string. Default is `30px sans-serif`.",
    type: "string"
  })
  font = "30px sans-serif";

  @primitiveTrait({
    name: "Style",
    description:
      'Label style. Possible values are `"FILL"`, `"OUTLINE"` and `"FILL_AND_OUTLINE"`. Default is `"FILL"`.',
    type: "string"
  })
  style = "FILL";

  @primitiveTrait({
    name: "Scale",
    description:
      "The scale of the label. The scale is multiplied with the pixel size of the label's text.",
    type: "number"
  })
  scale = 1;

  @primitiveTrait({
    name: "Fill color",
    description: "The fill color of the label.",
    type: "string"
  })
  fillColor = "#ffffff";

  @primitiveTrait({
    name: "Outline color",
    description: "The outline color of the label.",
    type: "string"
  })
  outlineColor = "#000000";

  @primitiveTrait({
    name: "Outline width",
    description: "The outline width of the label.",
    type: "number"
  })
  outlineWidth: number = 1;

  @primitiveArrayTrait({
    name: "Pixel offset",
    description: "The number of pixels up and to the right to place the label.",
    type: "number"
  })
  pixelOffset = [0, 0];

  @primitiveTrait({
    name: "Horizontal origin",
    description:
      'The horizontal location of an origin relative to an object. For example, LEFT will place the label on the right of the point. Possible values are `"LEFT"`, `"CENTER"` and `"RIGHT"`. Default is `"RIGHT"`.',
    type: "string"
  })
  horizontalOrigin: string = "LEFT";

  @primitiveTrait({
    name: "Vertical origin",
    description:
      'The vertical location of an origin relative to an object. For example, TOP will place the label above the point. Possible values are `"TOP"`, `"CENTER"`, `"BASELINE"` and `"BOTTOM"`. Default is `"CENTER"`.',
    type: "string"
  })
  verticalOrigin: string = "CENTER";
}

export class EnumLabelSymbolTraits extends mixTraits(
  LabelSymbolTraits,
  EnumStyleTraits
) {
  static isRemoval = EnumStyleTraits.isRemoval;
}

export class BinLabelSymbolTraits extends mixTraits(
  LabelSymbolTraits,
  BinStyleTraits
) {
  static isRemoval = BinStyleTraits.isRemoval;
}

export default class TableLabelStyleTraits
  extends mixTraits(TableStyleMapTraits)
  implements TableStyleMapModel<LabelSymbolTraits>
{
  // Override TableStyleMapTraits.enabled default
  @primitiveTrait({
    name: "Enabled",
    description: "True to enable. False by default",
    type: "boolean"
  })
  enabled = false;

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: EnumLabelSymbolTraits,
    idProperty: "value"
  })
  enum: EnumLabelSymbolTraits[] = [];

  @objectArrayTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: BinLabelSymbolTraits,
    idProperty: "index"
  })
  bin: BinLabelSymbolTraits[] = [];

  @objectTrait({
    name: "Enum Colors",
    description:
      "The colors to use for enumerated values. This property is ignored " +
      "if the `Color Column` type is not `enum`.",
    type: LabelSymbolTraits
  })
  null = new LabelSymbolTraits();
}
