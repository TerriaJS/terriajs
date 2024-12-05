declare namespace BottomDockChartScssNamespace {
  export interface IBottomDockChartScss {
    empty: string;
  }
}

declare const BottomDockChartScssModule: BottomDockChartScssNamespace.IBottomDockChartScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: BottomDockChartScssNamespace.IBottomDockChartScss;
};

export = BottomDockChartScssModule;
