declare namespace TimerScssNamespace {
  export interface ITimerScss {
    "background-circle": string;
    backgroundCircle: string;
    elapsedTime: string;
    timer: string;
  }
}

declare const TimerScssModule: TimerScssNamespace.ITimerScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: TimerScssNamespace.ITimerScss;
};

export = TimerScssModule;
