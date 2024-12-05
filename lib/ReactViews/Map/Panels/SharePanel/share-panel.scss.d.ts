declare namespace SharePanelScssNamespace {
  export interface ISharePanelScss {
    "btn--catalogShare": string;
    "btn--withoutText": string;
    btnCatalogShare: string;
    btnWithoutText: string;
    "catalog-share": string;
    "catalog-share-inner": string;
    catalogShare: string;
    catalogShareInner: string;
    "dropdown-inner": string;
    dropdownInner: string;
    "share-panel": string;
    sharePanel: string;
    "story-share": string;
    "story-share-inner": string;
    storyShare: string;
    storyShareInner: string;
  }
}

declare const SharePanelScssModule: SharePanelScssNamespace.ISharePanelScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: SharePanelScssNamespace.ISharePanelScss;
};

export = SharePanelScssModule;
