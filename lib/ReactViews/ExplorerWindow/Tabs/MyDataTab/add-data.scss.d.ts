declare namespace AddDataScssNamespace {
  export interface IAddDataScss {
    dropdownList: string;
    dropdown__list: string;
    inner: string;
    label: string;
    "tab-panel": string;
    "tab-panels": string;
    tabHeading: string;
    tabPanel: string;
    tabPanels: string;
    "url-input": string;
    "url-input__btn": string;
    "url-input__text-box": string;
    urlInput: string;
    urlInputBtn: string;
    urlInputTextBox: string;
  }
}

declare const AddDataScssModule: AddDataScssNamespace.IAddDataScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: AddDataScssNamespace.IAddDataScss;
};

export = AddDataScssModule;
