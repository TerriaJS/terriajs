declare namespace GuideScssNamespace {
  export interface IGuideScss {
    body: string;
    bodyFooter: string;
    bodyProgress: string;
    btn: string;
    "btn--tertiary": string;
    "btn-next": string;
    btnNext: string;
    btnTertiary: string;
    guide: string;
    image: string;
    "image-wrapper": string;
    imageWrapper: string;
    indicator: string;
    indicatorEnabled: string;
    indicatorWrapper: string;
    "inner-close-btn": string;
    innerCloseBtn: string;
  }
}

declare const GuideScssModule: GuideScssNamespace.IGuideScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: GuideScssNamespace.IGuideScss;
};

export = GuideScssModule;
