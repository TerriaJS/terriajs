declare namespace DataCatalogTabScssNamespace {
  export interface IDataCatalogTabScss {
    "data--catalog-group": string;
    "data-catalog": string;
    "data-explorer": string;
    dataCatalog: string;
    dataCatalogGroup: string;
    dataExplorer: string;
    label: string;
    root: string;
  }
}

declare const DataCatalogTabScssModule: DataCatalogTabScssNamespace.IDataCatalogTabScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: DataCatalogTabScssNamespace.IDataCatalogTabScss;
};

export = DataCatalogTabScssModule;
