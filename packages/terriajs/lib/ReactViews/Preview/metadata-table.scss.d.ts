declare namespace MetadataTableScssNamespace {
  export interface IMetadataTableScss {
    root: string;
    value: string;
  }
}

declare const MetadataTableScssModule: MetadataTableScssNamespace.IMetadataTableScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MetadataTableScssNamespace.IMetadataTableScss;
};

export = MetadataTableScssModule;
