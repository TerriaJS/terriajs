import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export class CogRenderOptionsTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "No Data Value",
    description: "No data value, default read from tiff meta"
  })
  nodata?: number;

  @primitiveTrait({
    type: "boolean",
    name: "Convert to RGB",
    description: "Try to render multi band cog to RGB, priority 1"
  })
  convertToRGB?: boolean;
}
