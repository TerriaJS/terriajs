import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class DiffableTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Can diff images",
    description:
      "True if this service supports computing imagery difference between two dates"
  })
  canDiffImages = false;

  @primitiveTrait({
    type: "boolean",
    name: "Show diff image",
    description: "True if currently showing diff image"
  })
  isShowingDiff = false;

  @primitiveTrait({
    type: "string",
    name: "First diff date",
    description: "The first date to use to compute the difference image"
  })
  firstDiffDate?: string;

  @primitiveTrait({
    type: "string",
    name: "Second diff date",
    description: "The second date to use to compute the difference image"
  })
  secondDiffDate?: string;

  @primitiveTrait({
    type: "string",
    name: "Diff style ID",
    description: "The ID of the style used to compute the difference image"
  })
  diffStyleId?: string;
}
