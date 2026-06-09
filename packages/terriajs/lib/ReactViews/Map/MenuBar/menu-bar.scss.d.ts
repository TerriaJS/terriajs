declare namespace MenuBarScssNamespace {
  export interface IMenuBarScss {
    flex: string;
    langBtn: string;
    menu: string;
    "menu-bar": string;
    "menu-bar--workbenchClosed": string;
    "menu-item": string;
    menuBar: string;
    menuBarWorkbenchClosed: string;
    menuItem: string;
  }
}

declare const MenuBarScssModule: MenuBarScssNamespace.IMenuBarScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MenuBarScssNamespace.IMenuBarScss;
};

export = MenuBarScssModule;
