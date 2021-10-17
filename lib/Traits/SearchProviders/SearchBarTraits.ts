import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";
import { RectangleTraits } from "../TraitsClasses/MappableTraits";

export class SearchBarTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "placeholder",
    description:
      "Input text field placeholder shown when no input has been given yet. The string is translateable."
  })
  placeholder: string = "translate#search.placeholder";

  @primitiveTrait({
    type: "number",
    name: "Recommended list length",
    description: "Maximum amount of entries in the suggestion list."
  })
  recommendedListLength: number = 5;

  @primitiveTrait({
    type: "number",
    name: "Flight duration seconds",
    description:
      "The duration of the camera flight to an entered location, in seconds."
  })
  flightDurationSeconds: number = 1.5;

  @primitiveTrait({
    type: "number",
    name: "Minimum characters",
    description: "Minimum number of characters required for search to start"
  })
  minCharacters: number = 3;

  @objectTrait({
    type: RectangleTraits,
    name: "Bounding box limit",
    description:
      "Bounding box limits for the search results {west, south, east, north}"
  })
  boundingBoxLimit?: RectangleTraits = Rectangle.MAX_VALUE;
}
