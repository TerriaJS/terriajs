import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export class ItemPropertiesByTypeTraits extends ModelTraits {
  @primitiveTrait({
    name: "Type of model",
    description:
      "The type of model to apply `itemProperties` to. This must be defined.",
    type: "string"
  })
  type?: string;

  @anyTrait({
    name: "Item Properties",
    description:
      "Sets traits on group member items of specified `type`. This applies to all nested group members (eg members in sub-groups)"
  })
  itemProperties?: JsonObject;
}

export class ItemPropertiesByIdTraits extends ModelTraits {
  @primitiveArrayTrait({
    name: "IDs of models",
    description: "The IDs of models to apply `itemProperties` to.",
    type: "string"
  })
  ids?: string[] = [];

  @anyTrait({
    name: "Item Properties",
    description:
      "Sets traits on group member items of specified `id`. This applies to all nested group members (eg members in sub-groups)"
  })
  itemProperties?: JsonObject;
}

export class ItemPropertiesTraits extends ModelTraits {
  @anyTrait({
    name: "Item Properties",
    description:
      "Sets traits on group member items (note - will **not** set traits to sub-groups). This applies to all nested group members (eg members in sub-groups). Also see `itemPropertiesByType` and `itemPropertiesByIds`.\n\n" +
      "Item properties will be set in the following order (highest to lowest priority) `itemPropertiesByIds`, `itemPropertiesByType`, `itemProperties`."
  })
  itemProperties?: JsonObject;

  @objectArrayTrait({
    name: "Item properties by type",
    description:
      "Sets traits on group member items by model `type` (eg `csv` or `geojson`). This applies to all nested group members (eg members in sub-groups). Only one `itemProperties` can be specified per `type`.\n\n" +
      "Item properties will be set in the following order (highest to lowest priority) `itemPropertiesByIds`, `itemPropertiesByType`, `itemProperties`.",
    type: ItemPropertiesByTypeTraits,
    idProperty: "type"
  })
  itemPropertiesByType: ItemPropertiesByTypeTraits[] = [];

  @objectArrayTrait({
    name: "Item properties by type",
    description:
      "Sets traits on group member items by model `ID`. This applies to all nested group members (eg members in sub-groups). Only one `itemProperties` can be specified per `id`.\n\n" +
      "Item properties will be set in the following order (highest to lowest priority) `itemPropertiesByIds`, `itemPropertiesByType`, `itemProperties`.",
    type: ItemPropertiesByIdTraits,
    idProperty: "index"
  })
  itemPropertiesByIds: ItemPropertiesByIdTraits[] = [];
}
