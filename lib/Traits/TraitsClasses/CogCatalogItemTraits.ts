import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import UrlTraits from "./UrlTraits";
import { traitClass } from "../Trait";

@traitClass({
  description:
    "Creates a Cloud Optimised Geotiff item in the catalog from a url pointing to a TIFF that is a valid COG.",
  example: {
    name: "COG Test Uluru",
    description:
      "This is a COG from Sentinel-2 L2A, in EPSG:32752. Does it display in correct location? Does it display correctly?",
    type: "cog",
    url: "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/52/J/FS/2023/5/S2A_52JFS_20230501_0_L2A/TCI.tif"
  }
})
export default class CogCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}
