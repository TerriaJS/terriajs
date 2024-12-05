declare namespace ChartExpandAndDownloadButtonsScssNamespace {
  export interface IChartExpandAndDownloadButtonsScss {
    "btn--dropdown": string;
    "btn-download": string;
    "btn-small": string;
    btnDownload: string;
    btnDropdown: string;
    btnSmall: string;
    dropdown: string;
    dropdownBtn: string;
    dropdownBtnOption: string;
    dropdownList: string;
    dropdown__btn: string;
    "dropdown__btn--option": string;
    dropdown__list: string;
  }
}

declare const ChartExpandAndDownloadButtonsScssModule: ChartExpandAndDownloadButtonsScssNamespace.IChartExpandAndDownloadButtonsScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ChartExpandAndDownloadButtonsScssNamespace.IChartExpandAndDownloadButtonsScss;
};

export = ChartExpandAndDownloadButtonsScssModule;
