declare namespace ColorscalerangeSectionScssNamespace {
  export interface IColorscalerangeSectionScss {
    btn: string;
    colorscalerange: string;
    field: string;
    title: string;
  }
}

declare const ColorscalerangeSectionScssModule: ColorscalerangeSectionScssNamespace.IColorscalerangeSectionScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ColorscalerangeSectionScssNamespace.IColorscalerangeSectionScss;
};

export = ColorscalerangeSectionScssModule;
