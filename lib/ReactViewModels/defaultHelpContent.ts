export enum PaneMode {
  videoAndContent = "videoAndContent",
  slider = "slider",
  trainer = "trainer"
}

export interface StepItem {
  title: string;
  description?: string;
}

export interface TrainerItem {
  title: string;
  steps: StepItem[];
}

export interface HelpContentItem {
  itemName: string;
  title?: string;

  videoUrl?: string;
  placeholderImage?: string;

  paneMode?: PaneMode;
  trainerItems?: TrainerItem[];

  markdownText?: string;
  icon?: string;
}
