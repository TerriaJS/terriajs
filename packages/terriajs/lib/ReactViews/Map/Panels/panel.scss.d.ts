declare namespace PanelScssNamespace {
  export interface IPanelScss {
    button: string;
    "button-for-modal-dropdown": string;
    buttonForModalDropdown: string;
    caret: string;
    content: string;
    heading: string;
    inner: string;
    "inner-close-btn": string;
    "inner-close-btn--for-modal": string;
    innerCloseBtn: string;
    innerCloseBtnForModal: string;
    "is-open": string;
    isOpen: string;
    label: string;
    link: string;
    overlay: string;
    panel: string;
    section: string;
    "show-dropdown-as-modal": string;
    "show-dropdown-in-center": string;
    showDropdownAsModal: string;
    showDropdownInCenter: string;
    "sub-heading": string;
    subHeading: string;
  }
}

declare const PanelScssModule: PanelScssNamespace.IPanelScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: PanelScssNamespace.IPanelScss;
};

export = PanelScssModule;
