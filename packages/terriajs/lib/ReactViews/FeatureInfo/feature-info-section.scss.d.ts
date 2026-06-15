declare namespace FeatureInfoSectionScssNamespace {
  export interface IFeatureInfoSectionScss {
    content: string;
    "raw-data-button": string;
    rawDataButton: string;
    section: string;
    "time-series-chart": string;
    timeSeriesChart: string;
    title: string;
  }
}

declare const FeatureInfoSectionScssModule: FeatureInfoSectionScssNamespace.IFeatureInfoSectionScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: FeatureInfoSectionScssNamespace.IFeatureInfoSectionScss;
};

export = FeatureInfoSectionScssModule;
