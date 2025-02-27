declare namespace MobileMenuScssNamespace {
  export interface IMobileMenuScss {
    "mobile-nav": string;
    "mobile-nav--hidden": string;
    mobileNav: string;
    mobileNavHidden: string;
    overlay: string;
  }
}

declare const MobileMenuScssModule: MobileMenuScssNamespace.IMobileMenuScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MobileMenuScssNamespace.IMobileMenuScss;
};

export = MobileMenuScssModule;
