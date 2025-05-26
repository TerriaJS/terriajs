declare namespace CesiumIonConnectorScssNamespace {
  export interface ICesiumIonConnectorScss {
    "add-asset-button": string;
    addAssetButton: string;
    "assets-list": string;
    assetsList: string;
    "connect-button": string;
    connectButton: string;
    "drop-down": string;
    "drop-down-button": string;
    dropDown: string;
    dropDownButton: string;
    "token-warning": string;
    "token-warning-hidden": string;
    tokenWarning: string;
    tokenWarningHidden: string;
  }
}

declare const CesiumIonConnectorScssModule: CesiumIonConnectorScssNamespace.ICesiumIonConnectorScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: CesiumIonConnectorScssNamespace.ICesiumIonConnectorScss;
};

export = CesiumIonConnectorScssModule;
