declare namespace TimerSectionScssNamespace {
  export interface ITimerSectionScss {
    section: string;
    "timer-container": string;
    timerContainer: string;
  }
}

declare const TimerSectionScssModule: TimerSectionScssNamespace.ITimerSectionScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: TimerSectionScssNamespace.ITimerSectionScss;
};

export = TimerSectionScssModule;
