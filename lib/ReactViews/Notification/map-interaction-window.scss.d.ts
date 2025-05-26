declare namespace MapInteractionWindowScssNamespace {
  export interface IMapInteractionWindowScss {
    btn: string;
    content: string;
    isActive: string;
    window: string;
  }
}

declare const MapInteractionWindowScssModule: MapInteractionWindowScssNamespace.IMapInteractionWindowScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MapInteractionWindowScssNamespace.IMapInteractionWindowScss;
};

export = MapInteractionWindowScssModule;
