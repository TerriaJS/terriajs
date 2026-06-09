declare namespace HelpButtonScssNamespace {
  export interface IHelpButtonScss {
    helpBtn: string;
  }
}

declare const HelpButtonScssModule: HelpButtonScssNamespace.IHelpButtonScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: HelpButtonScssNamespace.IHelpButtonScss;
};

export = HelpButtonScssModule;
