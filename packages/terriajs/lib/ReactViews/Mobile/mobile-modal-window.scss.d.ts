declare namespace MobileModalWindowScssNamespace {
  export interface IMobileModalWindowScss {
    "back-button": string;
    "back-button--inactive": string;
    backButton: string;
    backButtonInactive: string;
    button: string;
    "data-catalog": string;
    dataCatalog: string;
    "done-button": string;
    doneButton: string;
    "icon-back": string;
    iconBack: string;
    isOpen: string;
    mobileModal: string;
    "modal-top": string;
    modalBg: string;
    modalTop: string;
  }
}

declare const MobileModalWindowScssModule: MobileModalWindowScssNamespace.IMobileModalWindowScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MobileModalWindowScssNamespace.IMobileModalWindowScss;
};

export = MobileModalWindowScssModule;
