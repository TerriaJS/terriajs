declare namespace CesiumTimelineScssNamespace {
  export interface ICesiumTimelineScss {
    cesiumTimeline: string;
  }
}

declare const CesiumTimelineScssModule: CesiumTimelineScssNamespace.ICesiumTimelineScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: CesiumTimelineScssNamespace.ICesiumTimelineScss;
};

export = CesiumTimelineScssModule;
