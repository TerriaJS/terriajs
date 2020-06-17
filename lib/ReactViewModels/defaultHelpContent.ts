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

  paneMode?: PaneMode;
  trainerItems?: TrainerItem[];

  markdownText?: string;
  icon?: string;
}
