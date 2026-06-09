import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";

import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class SplitterTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Split direction",
    description:
      "The side of the splitter to display this imagery layer on. Defaults to both sides."
  })
  splitDirection = SplitDirection.NONE;

  @primitiveTrait({
    type: "boolean",
    name: "Disable splitter",
    description:
      "If true, splitter funcitonality will be hidden for this model."
  })
  disableSplitter = false;
}
