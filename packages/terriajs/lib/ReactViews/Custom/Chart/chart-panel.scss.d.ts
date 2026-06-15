declare namespace ChartPanelScssNamespace {
  export interface IChartPanelScss {
    axis: string;
    btn: string;
    "btn--close-chart-panel": string;
    btnCloseChartPanel: string;
    chart: string;
    "chart-panel": string;
    chartPanel: string;
    colors: string;
    header: string;
    holder: string;
    inner: string;
    "section-label": string;
    sectionLabel: string;
  }
}

declare const ChartPanelScssModule: ChartPanelScssNamespace.IChartPanelScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ChartPanelScssNamespace.IChartPanelScss;
};

export = ChartPanelScssModule;
