declare namespace DataPreviewScssNamespace {
  export interface IDataPreviewScss {
    "btn--back-to-map": string;
    btnBackToMap: string;
    field: string;
    h3: string;
    h4: string;
    placeholder: string;
    preview: string;
    "preview-chart": string;
    previewChart: string;
    previewInner: string;
    preview__inner: string;
  }
}

declare const DataPreviewScssModule: DataPreviewScssNamespace.IDataPreviewScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: DataPreviewScssNamespace.IDataPreviewScss;
};

export = DataPreviewScssModule;
