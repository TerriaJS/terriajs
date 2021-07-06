import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class HighlightColorTraits extends ModelTraits {
  @primitiveTrait({
    name: "Highlight color",
    type: "string",
    description:
      "The color used to highlight a feature when it is picked. If not set, this defaults to `Terria.baseMapContrastColor`"
  })
  highlightColor?: string;
}
