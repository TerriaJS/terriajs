declare namespace TabsScssNamespace {
  export interface ITabsScss {
    "btn--tab": string;
    btnTab: string;
    "panel-content": string;
    panelContent: string;
    "tab-left-col": string;
    "tab-list": string;
    "tab-list__item": string;
    "tab-panel": string;
    tabLeftCol: string;
    tabList: string;
    tabListItem: string;
    tabPanel: string;
    tabs: string;
  }
}

declare const TabsScssModule: TabsScssNamespace.ITabsScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: TabsScssNamespace.ITabsScss;
};

export = TabsScssModule;
