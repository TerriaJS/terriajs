declare namespace FeatureInfoDownloadScssNamespace {
  export interface IFeatureInfoDownloadScss {
    btn: string;
    download: string;
    dropdownButton: string;
    dropdownList: string;
    dropdown__button: string;
    dropdown__list: string;
    "icon--download": string;
    iconDownload: string;
  }
}

declare const FeatureInfoDownloadScssModule: FeatureInfoDownloadScssNamespace.IFeatureInfoDownloadScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: FeatureInfoDownloadScssNamespace.IFeatureInfoDownloadScss;
};

export = FeatureInfoDownloadScssModule;
