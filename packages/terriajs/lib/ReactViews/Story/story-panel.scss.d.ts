declare namespace StoryPanelScssNamespace {
  export interface IStoryPanelScss {
    "is-mounted": string;
    isMounted: string;
    left: string;
    right: string;
    "story-container": string;
    storyContainer: string;
  }
}

declare const StoryPanelScssModule: StoryPanelScssNamespace.IStoryPanelScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: StoryPanelScssNamespace.IStoryPanelScss;
};

export = StoryPanelScssModule;
