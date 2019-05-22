import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class TableScaleStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Scale Column",
    description:
      "The column to use to scale points. This property is ignored for regions.",
    type: "string"
  })
  scaleColumn?: string;
}
