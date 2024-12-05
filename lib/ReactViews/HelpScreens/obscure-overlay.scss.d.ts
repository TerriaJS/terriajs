declare namespace ObscureOverlayScssNamespace {
  export interface IObscureOverlayScss {
    bottomOverlay: string;
    clearOverlay: string;
    isActive: string;
    leftOverlay: string;
    rightOverlay: string;
    topOverlay: string;
  }
}

declare const ObscureOverlayScssModule: ObscureOverlayScssNamespace.IObscureOverlayScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ObscureOverlayScssNamespace.IObscureOverlayScss;
};

export = ObscureOverlayScssModule;
