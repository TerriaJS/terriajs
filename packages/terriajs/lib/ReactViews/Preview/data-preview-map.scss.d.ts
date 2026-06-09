declare namespace DataPreviewMapScssNamespace {
  export interface IDataPreviewMapScss {
    badge: string;
    map: string;
    placeholder: string;
    "terria-preview": string;
    terriaPreview: string;
  }
}

declare const DataPreviewMapScssModule: DataPreviewMapScssNamespace.IDataPreviewMapScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: DataPreviewMapScssNamespace.IDataPreviewMapScss;
};

export = DataPreviewMapScssModule;
