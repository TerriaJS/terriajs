declare namespace LegendScssNamespace {
  export interface ILegendScss {
    generatedLegend: string;
    imageAnchor: string;
    legend: string;
    "legend--svg": string;
    legendInner: string;
    legendLegendBoxImg: string;
    legendOpenExternally: string;
    legendSpacer: string;
    legendSvg: string;
    legendTitle: string;
    legendTitleAbove: string;
    legendTitleBelow: string;
    legendTitles: string;
    legend__inner: string;
    legend__legendBoxImg: string;
    loader: string;
  }
}

declare const LegendScssModule: LegendScssNamespace.ILegendScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: LegendScssNamespace.ILegendScss;
};

export = LegendScssModule;
