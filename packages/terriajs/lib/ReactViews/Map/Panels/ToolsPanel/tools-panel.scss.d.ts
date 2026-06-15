declare namespace ToolsPanelScssNamespace {
  export interface IToolsPanelScss {
    "dropdown-inner": string;
    dropdownInner: string;
    results: string;
    submit: string;
    toolsPanel: string;
  }
}

declare const ToolsPanelScssModule: ToolsPanelScssNamespace.IToolsPanelScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ToolsPanelScssNamespace.IToolsPanelScss;
};

export = ToolsPanelScssModule;
