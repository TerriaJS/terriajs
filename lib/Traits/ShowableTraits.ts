import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class ShowableTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Show",
    description:
      "Show or hide a workbench item. When show is false, a mappable item is removed from the map and a chartable item is removed from the chart panel."
  })
  show: boolean = true;
}
