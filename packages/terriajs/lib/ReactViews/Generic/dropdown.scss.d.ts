declare namespace DropdownScssNamespace {
  export interface IDropdownScss {
    "btn--dropdown": string;
    "btn--option": string;
    btnDropdown: string;
    btnOption: string;
    dropdown: string;
    "is-open": string;
    "is-selected": string;
    isOpen: string;
    isSelected: string;
    list: string;
    myDataDropdown: string;
  }
}

declare const DropdownScssModule: DropdownScssNamespace.IDropdownScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: DropdownScssNamespace.IDropdownScss;
};

export = DropdownScssModule;
