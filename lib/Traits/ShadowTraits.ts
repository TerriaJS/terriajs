import CatalogMemberTraits from "./CatalogMemberTraits";
import primitiveTrait from "./primitiveTrait";

export type Shadows = "CAST" | "RECEIVE" | "BOTH" | "NONE";

export default class ShadowTraits extends CatalogMemberTraits {
  @primitiveTrait({
    type: "string",
    name: "Shadows",
    description:
      "Determines whether the tileset casts or receives shadows from each light source."
  })
  shadows: Shadows = "NONE";

  @primitiveTrait({
    type: "boolean",
    name: "Show Shadow UI",
    description:
      "Determines whether the shadow UI component will be shown on the workbench item"
  })
  showShadowUi: boolean = true;
}
