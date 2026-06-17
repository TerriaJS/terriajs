declare namespace DataCatalogScssNamespace {
  export interface IDataCatalogScss {
    "data-catalog": string;
    dataCatalog: string;
    label: string;
  }
}

declare const DataCatalogScssModule: DataCatalogScssNamespace.IDataCatalogScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: DataCatalogScssNamespace.IDataCatalogScss;
};

export = DataCatalogScssModule;
