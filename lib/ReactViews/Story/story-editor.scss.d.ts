declare namespace StoryEditorScssNamespace {
  export interface IStoryEditorScss {
    body: string;
    cancelBtn: string;
    field: string;
    header: string;
    inner: string;
    "is-mounted": string;
    isMounted: string;
    popupEditor: string;
    saveBtn: string;
  }
}

declare const StoryEditorScssModule: StoryEditorScssNamespace.IStoryEditorScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: StoryEditorScssNamespace.IStoryEditorScss;
};

export = StoryEditorScssModule;
