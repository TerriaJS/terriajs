declare namespace ChartPanelDownloadButtonScssNamespace {
  export interface IChartPanelDownloadButtonScss {
    "btn-download": string;
    btnDownload: string;
  }
}

declare const ChartPanelDownloadButtonScssModule: ChartPanelDownloadButtonScssNamespace.IChartPanelDownloadButtonScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ChartPanelDownloadButtonScssNamespace.IChartPanelDownloadButtonScss;
};

export = ChartPanelDownloadButtonScssModule;
