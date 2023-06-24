import anyTrait from "../Decorators/anyTrait";
import JsonObject from "../../Core/Json";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import ArcGisPortalItemFormatTraits from "./ArcGisPortalItemFormatTraits";
import mixTraits from "../mixTraits";

export default class ArcGisPortalSharedTraits extends mixTraits() {
  @objectArrayTrait({
    name: "Supported Formats",
    description:
      "The supported formats and their mapping to Terria types. " +
      "These are listed in order of preference.",
    type: ArcGisPortalItemFormatTraits,
    idProperty: "id"
  })
  supportedFormats?: ArcGisPortalItemFormatTraits[];
}
