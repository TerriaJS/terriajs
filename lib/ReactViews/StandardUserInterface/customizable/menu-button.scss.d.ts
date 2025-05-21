declare namespace MenuButtonScssNamespace {
  export interface IMenuButtonScss {
    "btn--about-link": string;
    btnAboutLink: string;
  }
}

declare const MenuButtonScssModule: MenuButtonScssNamespace.IMenuButtonScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MenuButtonScssNamespace.IMenuButtonScss;
};

export = MenuButtonScssModule;
