declare namespace RelatedMapsScssNamespace {
  export interface IRelatedMapsScss {
    "dropdown-inner": string;
    dropdownInner: string;
    image: string;
  }
}

declare const RelatedMapsScssModule: RelatedMapsScssNamespace.IRelatedMapsScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: RelatedMapsScssNamespace.IRelatedMapsScss;
};

export = RelatedMapsScssModule;
