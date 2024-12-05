declare namespace FeatureInfoPanelScssNamespace {
  export interface IFeatureInfoPanelScss {
    body: string;
    "btn--close-feature": string;
    "btn--download": string;
    "btn-location": string;
    "btn-location-selected": string;
    btnCloseFeature: string;
    btnDownload: string;
    btnLocation: string;
    btnLocationSelected: string;
    btnPanelHeading: string;
    btnToggleFeature: string;
    header: string;
    "is-collapsed": string;
    "is-translucent": string;
    "is-visible": string;
    isCollapsed: string;
    isTranslucent: string;
    isVisible: string;
    location: string;
    "no-results": string;
    noResults: string;
    panel: string;
    satelliteSuggestionBtn: string;
  }
}

declare const FeatureInfoPanelScssModule: FeatureInfoPanelScssNamespace.IFeatureInfoPanelScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: FeatureInfoPanelScssNamespace.IFeatureInfoPanelScss;
};

export = FeatureInfoPanelScssModule;
