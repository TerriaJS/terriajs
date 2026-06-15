import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import UrlTraits from "./UrlTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates one catalog item from url that points to a template imagery service.`,
  example: {
    name: "url-template-imagery example",
    type: "url-template-imagery",
    url: "https://storage.googleapis.com/terria-datasets-public/basemaps/natural-earth-tiles/{z}/{x}/{reverseY}.png",
    maximumLevel: 7,
    id: "some unique id for url-template-imagery example"
  }
})
export default class UrlTemplateImageryCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Pick features URL",
    description:
      "URL template to use to use to pick features. See URL template to use to use to pick features for list of keywords. "
  })
  pickFeaturesUrl?: string;

  @primitiveArrayTrait({
    name: "Subdomains",
    description:
      "Array of subdomains, one of which will be prepended to each tile URL. This is useful for overcoming browser limit on the number of simultaneous requests per host. Subdomains will be substituted for ${s} keyword",
    type: "string"
  })
  subdomains: string[] = [];
}
