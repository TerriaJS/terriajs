import CatalogMemberFactory from "../../Models/Catalog/CatalogMemberFactory";
import modelReferenceTrait from "../Decorators/modelReferenceTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelReference from "../ModelReference";
import ModelTraits from "../ModelTraits";

export class BaseMapTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Image",
    description: "Path to the basemap image"
  })
  image?: string;

  @primitiveTrait({
    type: "string",
    name: "Contrast color",
    description:
      "Color which should be used to contrast with basemap (eg for region mapping feature borders)"
  })
  contrastColor?: string = "#ffffff";

  @modelReferenceTrait({
    factory: CatalogMemberFactory,
    name: "Base map item",
    description:
      'Catalog item definition to be used for the base map. It is also possible to reference an existing catalog item using its id (i.e. `"//Surface Geology"`).'
  })
  item?: ModelReference;
}

export class BaseMapsTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "defaultBaseMapId",
    description:
      "The id of the baseMap user will see on the first mapLoad. This wil be used **before** `defaultBaseMapName`"
  })
  defaultBaseMapId?: string;

  @primitiveTrait({
    type: "string",
    name: "defaultBaseMapName",
    description: "Name of the base map to use as default"
  })
  defaultBaseMapName?: string;

  @primitiveTrait({
    type: "string",
    name: "previewBaseMapId",
    description:
      "The id of the baseMap to be used as the base map in data preview. "
  })
  previewBaseMapId?: string = "basemap-positron";

  @objectArrayTrait<BaseMapTraits>({
    type: BaseMapTraits,
    idProperty: "item",
    name: "items",
    description:
      "Array of catalog items definitions that can be used as a Base map."
  })
  items?: BaseMapTraits[];

  @primitiveArrayTrait({
    type: "string",
    name: "enabledBaseMaps",
    description:
      "Array of base maps ids that is available to user. Use this do define order of the base maps in settings panel. Leave undefined to show all basemaps."
  })
  enabledBaseMaps?: string[];
}
