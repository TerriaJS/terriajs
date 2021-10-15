import MappableMixin, { ImageryParts } from "../ModelMixins/MappableMixin";
import { BaseModel } from "./Definition/Model";
import Feature from "./Feature";

/**
 * Returns true if the given feature belongs to the catalog item
 */
export default function doesImageryFeatureBelongToItem(
  feature: Feature,
  item: BaseModel
): Boolean {
  if (!MappableMixin.isMixedInto(item)) return false;
  const imageryProvider = feature.imageryLayer?.imageryProvider;
  if (imageryProvider === undefined) return false;
  return item.mapItems.some(
    m => ImageryParts.is(m) && m.imageryProvider === imageryProvider
  );
}
