declare namespace FilterSectionScssNamespace {
  export interface IFilterSectionScss {
    filter: string;
    filters: string;
  }
}

declare const FilterSectionScssModule: FilterSectionScssNamespace.IFilterSectionScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: FilterSectionScssNamespace.IFilterSectionScss;
};

export = FilterSectionScssModule;
