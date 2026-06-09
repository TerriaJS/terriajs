declare namespace SatelliteImageryTimeFilterSectionScssNamespace {
  export interface ISatelliteImageryTimeFilterSectionScss {
    active: string;
    btn: string;
    btnGroup: string;
    inactive: string;
    infoGroup: string;
  }
}

declare const SatelliteImageryTimeFilterSectionScssModule: SatelliteImageryTimeFilterSectionScssNamespace.ISatelliteImageryTimeFilterSectionScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: SatelliteImageryTimeFilterSectionScssNamespace.ISatelliteImageryTimeFilterSectionScss;
};

export = SatelliteImageryTimeFilterSectionScssModule;
