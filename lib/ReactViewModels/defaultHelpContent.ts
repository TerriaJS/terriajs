export enum PaneMode {
  videoAndContent = "videoAndContent",
  slider = "slider",
  trainer = "trainer"
}

export interface StepItem {
  title: string;
  markdownDescription?: string;
}

export interface TrainerItem {
  title: string;
  footnote?: string;
  steps: StepItem[];
}

export interface HelpContentItem {
  itemName: string;
  title?: string;

  videoUrl?: string;
  placeholderImage?: string;

  // The `placeholderImage` is also used as background cover image for the container that embeds the video. This setting allows us to control the opacity of the cover image.
  videoCoverImageOpacity?: number;

  paneMode?: PaneMode;
  trainerItems?: TrainerItem[];

  markdownText?: string;
  icon?: string;
}
