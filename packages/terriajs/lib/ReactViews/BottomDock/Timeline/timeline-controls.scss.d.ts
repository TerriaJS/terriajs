declare namespace TimelineControlsScssNamespace {
  export interface ITimelineControlsScss {
    controls: string;
    "is-active": string;
    isActive: string;
    timelineControl: string;
    timeline__control: string;
  }
}

declare const TimelineControlsScssModule: TimelineControlsScssNamespace.ITimelineControlsScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: TimelineControlsScssNamespace.ITimelineControlsScss;
};

export = TimelineControlsScssModule;
