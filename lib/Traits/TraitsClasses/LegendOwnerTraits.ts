import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";
import LegendTraits from "./LegendTraits";

export default class LegendOwnerTraits extends ModelTraits {
  @objectArrayTrait({
    name: "Legend URLs",
    description: "The legends to display on the workbench.",
    type: LegendTraits,
    idProperty: "index",
    merge: false
  })
  legends?: LegendTraits[];

  @primitiveTrait({
    type: "string",
    name: "Legend background color",
    description:
      "Apply background color to all legends. This can be useful if legends are transparent and clash with Terria colours"
  })
  legendBackgroundColor?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Hide legend in workbench",
    description:
      "Whether the legend is hidden in the workbench for this catalog member."
  })
  hideLegendInWorkbench: boolean = false;
}
