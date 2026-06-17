declare namespace LocationItemScssNamespace {
  export interface ILocationItemScss {
    location: string;
  }
}

declare const LocationItemScssModule: LocationItemScssNamespace.ILocationItemScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: LocationItemScssNamespace.ILocationItemScss;
};

export = LocationItemScssModule;
