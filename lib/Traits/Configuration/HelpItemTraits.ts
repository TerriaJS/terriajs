import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export enum PaneMode {
  videoAndContent = "videoAndContent",
  slider = "slider",
  trainer = "trainer"
}

export class StepItemTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Title",
    description: "Title of the step."
  })
  title!: string;

  @primitiveTrait({
    type: "string",
    name: "Markdown description",
    description: "Step description in markdown form."
  })
  markdownDescription!: string;
}

export class TrainerItemTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Title",
    description: "Title of the trainer item."
  })
  title!: string;

  @primitiveTrait({
    type: "string",
    name: "Footnote",
    description: "Footnote for the trainer item."
  })
  footnote?: string;

  @objectArrayTrait({
    type: StepItemTraits,
    name: "Footnote",
    description: "Footnote for the trainer item.",
    idProperty: "index"
  })
  steps?: StepItemTraits[];
}

export class HelpItemTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Item name",
    description: "Name of the help content item"
  })
  itemName!: string;

  @primitiveTrait({
    type: "string",
    name: "Item title",
    description: "Title of the help content item."
  })
  title?: string;

  @primitiveTrait({
    type: "string",
    name: "Video url",
    description: "Url of the video for the help content item."
  })
  videoUrl?: string;

  @primitiveTrait({
    type: "string",
    name: "Placeholder image",
    description: "Url of the placeholder image for the help content item."
  })
  placeholderImage?: string;

  @primitiveTrait({
    type: "string",
    name: "Placeholder image",
    description: "Url of the placeholder image for the help content item."
  })
  paneMode!: "videoAndContent" | "slider" | "trainer";

  @objectArrayTrait({
    type: TrainerItemTraits,
    name: "",
    description: "",
    idProperty: "index"
  })
  trainerItems?: TrainerItemTraits[];

  @primitiveTrait({
    type: "string",
    name: "Markdown text",
    description: "Content for the help item."
  })
  markdownText?: string;

  @primitiveTrait({
    type: "string",
    name: "Icon",
    description: "Icon to show for the help content item."
  })
  icon?: string;
}
