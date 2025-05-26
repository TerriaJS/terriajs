declare namespace ExplorerWindowScssNamespace {
  export interface IExplorerWindowScss {
    "btn--close-modal": string;
    btnCloseModal: string;
    "explorer-panel": string;
    explorerPanel: string;
    "is-mounted": string;
    isMounted: string;
    "modal-overlay": string;
    "modal-wrapper": string;
    modalOverlay: string;
    modalWrapper: string;
  }
}

declare const ExplorerWindowScssModule: ExplorerWindowScssNamespace.IExplorerWindowScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ExplorerWindowScssNamespace.IExplorerWindowScss;
};

export = ExplorerWindowScssModule;
