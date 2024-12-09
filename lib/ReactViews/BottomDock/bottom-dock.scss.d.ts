declare namespace BottomDockScssNamespace {
  export interface IBottomDockScss {
    "bottom-dock": string;
    bottomDock: string;
  }
}

declare const BottomDockScssModule: BottomDockScssNamespace.IBottomDockScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: BottomDockScssNamespace.IBottomDockScss;
};

export = BottomDockScssModule;
