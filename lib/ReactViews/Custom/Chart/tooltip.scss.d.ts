declare namespace TooltipScssNamespace {
  export interface ITooltipScss {
    group: string;
    item: string;
    itemName: string;
    itemSymbol: string;
    itemValue: string;
    tooltip: string;
    "transition-enter": string;
    "transition-enter-active": string;
    "transition-exit": string;
    "transition-exit-active": string;
    transitionEnter: string;
    transitionEnterActive: string;
    transitionExit: string;
    transitionExitActive: string;
  }
}

declare const TooltipScssModule: TooltipScssNamespace.ITooltipScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: TooltipScssNamespace.ITooltipScss;
};

export = TooltipScssModule;
