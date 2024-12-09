declare namespace SettingPanelScssNamespace {
  export interface ISettingPanelScss {
    "dropdown-inner": string;
    dropdownInner: string;
  }
}

declare const SettingPanelScssModule: SettingPanelScssNamespace.ISettingPanelScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: SettingPanelScssNamespace.ISettingPanelScss;
};

export = SettingPanelScssModule;
