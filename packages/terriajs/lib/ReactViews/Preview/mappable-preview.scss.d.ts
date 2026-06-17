declare namespace MappablePreviewScssNamespace {
  export interface IMappablePreviewScss {
    "btn--add": string;
    "btn--add-all": string;
    btnAdd: string;
    btnAddAll: string;
    description: string;
    error: string;
    field: string;
    h3: string;
    h4: string;
    metadata: string;
    "previewed--info": string;
    previewedInfo: string;
    "share-link--wrapper": string;
    shareLinkWrapper: string;
    "title-and-share-wrapper": string;
    titleAndShareWrapper: string;
  }
}

declare const MappablePreviewScssModule: MappablePreviewScssNamespace.IMappablePreviewScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MappablePreviewScssNamespace.IMappablePreviewScss;
};

export = MappablePreviewScssModule;
