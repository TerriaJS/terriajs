declare namespace StoryBuilderScssNamespace {
  export interface IStoryBuilderScss {
    VideoGuideWrapper: string;
    "VideoGuideWrapper--closing": string;
    actions: string;
    captureBtn: string;
    footer: string;
    header: string;
    "hide-button": string;
    hideButton: string;
    intro: string;
    isActive: string;
    isHidden: string;
    isVisible: string;
    previewBtn: string;
    "remove-button": string;
    removeBtn: string;
    removeButton: string;
    stories: string;
    "stories-actions": string;
    storiesActions: string;
    story: string;
    "story-fade-in": string;
    "story-fade-out": string;
    "story-panel": string;
    "story-slide-down": string;
    "story-slide-up": string;
    storyFadeIn: string;
    storyFadeOut: string;
    storyPanel: string;
    storySlideDown: string;
    storySlideUp: string;
    title: string;
    trashBtn: string;
    tutBtn: string;
    videoGuide: string;
    "videoGuide--iframe": string;
    videoGuideIframe: string;
    videoGuideLoading: string;
    videoGuideRatio: string;
    videoGuideWrapper: string;
    videoGuideWrapperClosing: string;
  }
}

declare const StoryBuilderScssModule: StoryBuilderScssNamespace.IStoryBuilderScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: StoryBuilderScssNamespace.IStoryBuilderScss;
};

export = StoryBuilderScssModule;
