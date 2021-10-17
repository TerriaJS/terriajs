import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export class BrandBarTraits extends ModelTraits {
  @primitiveArrayTrait({
    name: "Brand bar elements",
    type: "string",
    description:
      "An array of strings of HTML that fill up the top left logo space (see `brandBarSmallElements` or `displayOneBrand` for small screens)."
  })
  elements?: string[];

  @primitiveArrayTrait({
    name: "Brand bar small elements",
    type: "string",
    description:
      "An array of strings of HTML that fill up the top left logo space - used for small screens."
  })
  smallElements?: string[];

  @primitiveTrait({
    name: "Display one brand",
    type: "number",
    description:
      "Index of which `brandBar.elements` to show for mobile header. This will be used if `brandBar.smallElements` is undefined."
  })
  displayOneBrand: number = 0;
}
