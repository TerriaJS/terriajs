import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import UrlTraits from "./UrlTraits";

export default class GoogleTileMapsCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    type: "string",
    name: "key",
    description:
      "Yout Google API key"
  })
  key: string = "";

  @primitiveTrait({
    type: "string",
    name: "key",
    description:
      "One of 'satellite', 'roadmap', 'terrain'"
  })
  mapType: "satellite" | "roadmap" | "terrain" = "satellite";

  @primitiveTrait({
    type: "string",
    name: "language",
    description:
      "An IETF language tag that specifies the language used to display information on the tiles. For example, en-US specifies the English language as spoken in the United States."
  })
  language?: string;

  @primitiveTrait({
    type: "string",
    name: "region",
    description:
      "A Common Locale Data Repository region identifier (two uppercase letters) that represents the physical location of the user. For example, US."
  })
  region?: string;
}
