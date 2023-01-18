import Constructor from "../../Core/Constructor";
import ModelTraits from "../../Traits/ModelTraits";
import Model, { ModelConstructor } from "./Model";

/**
 * Useful for defining catalog items that overrides some trait value.
 *
 *
 * eg: ```
 *   interface TraitOverrides {
 *     shortReport: string | undefined;
 *   }
 *
 *   // We merge the interface and class, so that we can pass the type as an argument to WithTraitOverrides()
 *   // There might be other ways of acheiving this
 *   class TraitOverrides {}
 *
 *   class SomeCatalogMember extends WithTraitOverrides(
 *     CatalogMemberMixin(CreateModel(CatalogMemberTraits)),
 *     TraitOverrides
 *    ) {}
 * ```
 *
 */
export default function WithTraitOverrides<
  T extends ModelTraits,
  M extends Model<T>,
  TOverrides extends Partial<T>
>(
  Base: ModelConstructor<M>,
  _PartialTraits: Constructor<TOverrides>
): ModelConstructor<M & TOverrides> {
  // TODO: Because we <any> cast below, If TOverrides contain properties not in
  // T, then it can result in non-existent properties in the type of the catalog item.
  // Is there some way to fix that?
  return Base as any;
}
