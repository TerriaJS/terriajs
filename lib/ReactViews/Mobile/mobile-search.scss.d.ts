declare namespace MobileSearchScssNamespace {
  export interface IMobileSearchScss {
    btnList: string;
    data: string;
    items: string;
    label: string;
    location: string;
    "provider-result": string;
    providerResult: string;
    results: string;
  }
}

declare const MobileSearchScssModule: MobileSearchScssNamespace.IMobileSearchScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MobileSearchScssNamespace.IMobileSearchScss;
};

export = MobileSearchScssModule;
