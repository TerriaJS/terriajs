declare namespace LoaderScssNamespace {
  export interface ILoaderScss {
    "loader-ui": string;
    "loader-ui-hide": string;
    loaderUi: string;
    loaderUiHide: string;
  }
}

declare const LoaderScssModule: LoaderScssNamespace.ILoaderScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: LoaderScssNamespace.ILoaderScss;
};

export = LoaderScssModule;
