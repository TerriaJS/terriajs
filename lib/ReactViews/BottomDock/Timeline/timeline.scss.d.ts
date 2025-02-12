declare namespace TimelineScssNamespace {
  export interface ITimelineScss {
    controlsRow: string;
    "layer-name-truncated": string;
    layerNameTruncated: string;
    "text-cell": string;
    "text-row": string;
    textCell: string;
    textRow: string;
    timeline: string;
  }
}

declare const TimelineScssModule: TimelineScssNamespace.ITimelineScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: TimelineScssNamespace.ITimelineScss;
};

export = TimelineScssModule;
