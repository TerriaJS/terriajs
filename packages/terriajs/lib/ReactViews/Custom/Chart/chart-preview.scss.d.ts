declare namespace ChartPreviewScssNamespace {
  export interface IChartPreviewScss {
    "chart-td": string;
    "chart-title-from-table": string;
    chartTd: string;
    chartTitleFromTable: string;
    "preview-chart": string;
    "preview-chart-wrapper": string;
    previewChart: string;
    previewChartWrapper: string;
  }
}

declare const ChartPreviewScssModule: ChartPreviewScssNamespace.IChartPreviewScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ChartPreviewScssNamespace.IChartPreviewScss;
};

export = ChartPreviewScssModule;
