declare namespace StoryButtonScssNamespace {
  export interface IStoryButtonScss {
    storyBtn: string;
  }
}

declare const StoryButtonScssModule: StoryButtonScssNamespace.IStoryButtonScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: StoryButtonScssNamespace.IStoryButtonScss;
};

export = StoryButtonScssModule;
