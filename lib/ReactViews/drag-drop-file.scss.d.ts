declare namespace DragDropFileScssNamespace {
  export interface IDragDropFileScss {
    caption: string;
    "drop-zone": string;
    dropZone: string;
    heading: string;
    inner: string;
    "is-active": string;
    isActive: string;
  }
}

declare const DragDropFileScssModule: DragDropFileScssNamespace.IDragDropFileScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: DragDropFileScssNamespace.IDragDropFileScss;
};

export = DragDropFileScssModule;
