import primitiveTrait from "../Decorators/primitiveTrait";
// import objectTrait from "../Decorators/objectTrait";
import ModelTraits from "../ModelTraits";
// import objectArrayTrait from "../Decorators/objectArrayTrait";
// import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";

// class ColorsDefinitionTraits extends ModelTraits {
//   @primitiveTrait({
//     type: "number",
//     name: "Index",
//     description: "The index of the color."
//   })
//   index?: number;

//   @primitiveTrait({
//     type: "string",
//     name: "Color",
//     description: "The color."
//   })
//   color?: string;
// }

// class BandOptionsTraits extends ModelTraits {
//   @primitiveTrait({
//     type: "number",
//     name: "Band",
//     description: "The band number, starting from 1."
//   })
//   band?: number;

//   @primitiveTrait({
//     type: "number",
//     name: "Min",
//     description: "The minimum value for scaling."
//   })
//   min?: number;

//   @primitiveTrait({
//     type: "number",
//     name: "Max",
//     description: "The maximum value for scaling."
//   })
//   max?: number;
// }

// class MultiBandRenderOptionsTraits extends ModelTraits {
//   @objectTrait({
//     type: BandOptionsTraits,
//     name: "Red Band",
//     description: "Options for the red band, where band value starts from 1."
//   })
//   r?: BandOptionsTraits;

//   @objectTrait({
//     type: BandOptionsTraits,
//     name: "Green Band",
//     description: "Options for the green band, where band value starts from 1."
//   })
//   g?: BandOptionsTraits;

//   @objectTrait({
//     type: BandOptionsTraits,
//     name: "Blue Band",
//     description: "Options for the blue band, where band value starts from 1."
//   })
//   b?: BandOptionsTraits;
// }

// class SingleBandRenderOptionsTraits extends ModelTraits {
//   @primitiveTrait({
//     type: "number",
//     name: "Band",
//     description: "Band index starts from 1, defaults to 1."
//   })
//   band?: number;

//   @primitiveTrait({
//     type: "string",
//     name: "Color Scale Image",
//     description: "The color scale image to use."
//   })
//   colorScaleImage?: string;

//   // @primitiveTrait({
//   //   type: "string",
//   //   name: "Color Scale",
//   //   description: "The name of a named color scale to use."
//   // })
//   // colorScale?: ColorScaleNames;

//   @primitiveArrayTrait({
//     type:"string",
//     name: "Colors",
//     description:
//       "Custom interpolate colors, [stopValue(0 - 1), color] or [color], if the latter, means equal distribution.",
//   })
//   colors?: string[];

//   @primitiveTrait({
//     type: "boolean",
//     name: "Use Real Value",
//     description:
//       "Determine whether to use the true value range for custom color ranges."
//   })
//   useRealValue?: boolean;

//   @primitiveTrait({
//     type: "string",
//     name: "Type",
//     description: "Defaults to continuous."
//   })
//   type?: "continuous" | "discrete";

//   // @objectTrait({
//   //   type: Object,
//   //   name: "Domain",
//   //   description: "The value domain to scale the color."
//   // })
//   // domain?: [number, number];

//   // @objectTrait({
//   //   type: Object,
//   //   name: "Display Range",
//   //   description: "Range of values that will be rendered, values outside of the range will be transparent."
//   // })
//   // displayRange?: [number, number];

//   @primitiveTrait({
//     type: "boolean",
//     name: "Apply Display Range",
//     description: "Set if displayRange should be used."
//   })
//   applyDisplayRange?: boolean;

//   @primitiveTrait({
//     type: "boolean",
//     name: "Clamp Low",
//     description: "Whether or not values below the domain shall be clamped."
//   })
//   clampLow?: boolean;

//   @primitiveTrait({
//     type: "boolean",
//     name: "Clamp High",
//     description:
//       "Whether or not values above the domain shall be clamped (if not defined defaults to clampLow value)."
//   })
//   clampHigh?: boolean;

//   @primitiveTrait({
//     type: "string",
//     name: "Expression",
//     description:
//       "Sets a mathematical expression to be evaluated on the plot. Don't forget to set the domain parameter!"
//   })
//   expression?: string;
// }

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

  // @objectTrait({
  //   type: MultiBandRenderOptionsTraits,
  //   name: "Multi Band Render Options",
  //   description: "Priority 2"
  // })
  // multi?: MultiBandRenderOptionsTraits;

  // @objectTrait({
  //   type: SingleBandRenderOptionsTraits,
  //   name: "Single Band Render Options",
  //   description: "Priority 3"
  // })
  // single?: SingleBandRenderOptionsTraits;
}
