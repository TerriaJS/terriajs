declare namespace SlideUpFadeInScssNamespace {
  export interface ISlideUpFadeInScss {
    enter: string;
    "enter-active": string;
    enterActive: string;
    exit: string;
    "exit-active": string;
    exitActive: string;
  }
}

declare const SlideUpFadeInScssModule: SlideUpFadeInScssNamespace.ISlideUpFadeInScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: SlideUpFadeInScssNamespace.ISlideUpFadeInScss;
};

export = SlideUpFadeInScssModule;
