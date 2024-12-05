declare namespace DragDropNotificationScssNamespace {
  export interface IDragDropNotificationScss {
    action: string;
    filename: string;
    icon: string;
    info: string;
    isActive: string;
    notification: string;
  }
}

declare const DragDropNotificationScssModule: DragDropNotificationScssNamespace.IDragDropNotificationScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: DragDropNotificationScssNamespace.IDragDropNotificationScss;
};

export = DragDropNotificationScssModule;
