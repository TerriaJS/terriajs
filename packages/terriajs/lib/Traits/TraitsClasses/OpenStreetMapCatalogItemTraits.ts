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
  description: `Creates one base map item from url that points to an OpenStreetMap service.`,
  example: {
    item: {
      type: "open-street-map",
      name: "Voyager",
      url: "https://global.ssl.fastly.net/rastertiles/voyager/",
      attribution: "© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0",
      opacity: 1,
      subdomains: [
        "cartodb-basemaps-a",
        "cartodb-basemaps-b",
        "cartodb-basemaps-c",
        "cartodb-basemaps-d"
      ]
    },
    image:
      "https://terria-catalogs-public.storage.googleapis.com/misc/basemaps/icons/voyager-aus.png",
    id: "some unique id"
  }
})
export default class OpenStreetMapCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    name: "File extension",
    description: "The file extension used to retrieve Open Street Map data",
    type: "string"
  })
  fileExtension = "png";

  @primitiveArrayTrait({
    name: "Subdomains",
    description:
      "Array of subdomains, one of which will be prepended to each tile URL. This is useful for overcoming browser limit on the number of simultaneous requests per host.",
    type: "string"
  })
  subdomains: string[] = [];
}
