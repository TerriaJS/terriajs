declare namespace FadeInScssNamespace {
  export interface IFadeInScss {
    enter: string;
    "enter-active": string;
    enterActive: string;
    exit: string;
    "exit-active": string;
    exitActive: string;
  }
}

declare const FadeInScssModule: FadeInScssNamespace.IFadeInScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: FadeInScssNamespace.IFadeInScss;
};

export = FadeInScssModule;
