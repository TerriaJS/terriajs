import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ExportableTraits from "./ExportableTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import TimeFilterTraits from "./TimeFilterTraits";

export default class DiffableTraits extends mixTraits(
  TimeFilterTraits,
  LegendOwnerTraits,
  ExportableTraits
) {
  @primitiveArrayTrait({
    type: "string",
    name: "Available diff styles",
    description:
      "List of styles that can be used for computing difference image"
  })
  availableDiffStyles?: string[] = [];

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

  @anyTrait({
    name: "Difference item properties",
    description: "Additional properties to set on the difference output item."
  })
  diffItemProperties?: JsonObject;
}
