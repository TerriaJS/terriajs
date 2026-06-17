declare namespace DataCatalogGroupScssNamespace {
  export interface IDataCatalogGroupScss {
    "add-remove-button": string;
    addRemoveButton: string;
    "btn--catalog": string;
    btnCatalog: string;
    btnCatalogTopLevel: string;
    caret: string;
    "catalog-group": string;
    "catalog-group--lower-level": string;
    catalogGroup: string;
    catalogGroupLowerLevel: string;
    folder: string;
    label: string;
    "label--no-results": string;
    labelNoResults: string;
    offsetRight: string;
    root: string;
    trashGroup: string;
  }
}

declare const DataCatalogGroupScssModule: DataCatalogGroupScssNamespace.IDataCatalogGroupScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: DataCatalogGroupScssNamespace.IDataCatalogGroupScss;
};

export = DataCatalogGroupScssModule;
