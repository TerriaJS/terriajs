import defaultTerms from "../../ReactViewModels/defaultTerms";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
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

export class HelpContentItemTraits extends ModelTraits {
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

export class TermTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Term",
    description: "Term to search for."
  })
  term!: string;

  @primitiveTrait({
    type: "string",
    name: "Content",
    description: "Content to show to user on term hover."
  })
  content!: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Aliases",
    description: "Term aliases to look for."
  })
  aliases?: string[];
}

export class HelpContentTraits extends ModelTraits {
  @objectArrayTrait({
    type: HelpContentItemTraits,
    name: "Help content items",
    description: "The content to be displayed in the help panel.",
    idProperty: "index"
  })
  items?: HelpContentItemTraits[];

  @objectArrayTrait({
    name: "Help content terms",
    type: TermTraits,
    description: "The content to be displayed in the help panel.",
    idProperty: "index"
  })
  terms: TermTraits[] = defaultTerms;
}
