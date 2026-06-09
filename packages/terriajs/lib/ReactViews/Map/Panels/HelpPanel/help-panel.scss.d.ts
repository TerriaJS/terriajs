declare namespace HelpPanelScssNamespace {
  export interface IHelpPanelScss {
    "help-panel": string;
    "help-panel-shifted": string;
    helpPanel: string;
    helpPanelShifted: string;
    isHidden: string;
    isVisible: string;
    link: string;
    shiftedToRight: string;
    "story-fade-in": string;
    "story-fade-out": string;
    "story-slide-down": string;
    "story-slide-up": string;
    storyFadeIn: string;
    storyFadeOut: string;
    storySlideDown: string;
    storySlideUp: string;
    tourBtn: string;
    "video-panel": string;
    videoBtn: string;
    videoGuide: string;
    "videoGuide--iframe": string;
    videoGuideIframe: string;
    videoGuideLoading: string;
    videoGuideRatio: string;
    videoGuideWrapperFullScreen: string;
    videoLink: string;
    videoPanel: string;
  }
}

declare const HelpPanelScssModule: HelpPanelScssNamespace.IHelpPanelScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: HelpPanelScssNamespace.IHelpPanelScss;
};

export = HelpPanelScssModule;
