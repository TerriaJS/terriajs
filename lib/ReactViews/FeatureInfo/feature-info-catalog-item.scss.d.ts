declare namespace FeatureInfoCatalogItemScssNamespace {
  export interface IFeatureInfoCatalogItemScss {
    "message-item": string;
    messageItem: string;
    sections: string;
  }
}

declare const FeatureInfoCatalogItemScssModule: FeatureInfoCatalogItemScssNamespace.IFeatureInfoCatalogItemScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: FeatureInfoCatalogItemScssNamespace.IFeatureInfoCatalogItemScss;
};

export = FeatureInfoCatalogItemScssModule;
