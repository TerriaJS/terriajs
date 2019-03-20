import mixCatalogMemberTraits from "./mixCatalogMemberTraits";
import ModelTraits from "./ModelTraits";
import mixUrlTraits from "./mixUrlTraits";
import mixGetCapabilitiesTraits from "./mixGetCapabilitiesTraits";

export default class GeoJsonCatalogItemTraits extends mixGetCapabilitiesTraits(
    mixUrlTraits(mixCatalogMemberTraits(ModelTraits))
) {}
