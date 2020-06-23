import primitiveTrait from "./primitiveTrait";
import ModelTraits from "./ModelTraits";

export default class ShadowTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Shadows",
    description:
      "Determines whether the tileset casts or receives shadows from each light source."
  })
  shadows: "CAST" | "RECEIVE" | "BOTH" | "NONE" = "NONE";

  @primitiveTrait({
    type: "boolean",
    name: "Show Shadow UI",
    description:
      "Determines whether the shadow UI component will be shown on the workbench item"
  })
  showShadowUi: boolean = true;
}
