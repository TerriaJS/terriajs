declare namespace MobileMenuItemScssNamespace {
  export interface IMobileMenuItemScss {
    icon: string;
    link: string;
    root: string;
  }
}

declare const MobileMenuItemScssModule: MobileMenuItemScssNamespace.IMobileMenuItemScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MobileMenuItemScssNamespace.IMobileMenuItemScss;
};

export = MobileMenuItemScssModule;
