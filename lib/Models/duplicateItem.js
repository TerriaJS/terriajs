import createCatalogMemberFromType from "./createCatalogMemberFromType";

export default function(item, id, name) {
  // Stringify then parse to ensure there is no shared references to original item properties
  const itemJson = JSON.parse(JSON.stringify(item.serializeToJson()));
  itemJson.id = id;
  itemJson.name = name;
  const newItem = createCatalogMemberFromType(item.type, item.terria);
  newItem.updateFromJson(itemJson);
  return newItem;
}
