import { action, computed } from "mobx";
import Constructor from "../Core/Constructor";
import ItemSearchProvider, {
  ItemSearchResult
} from "../Models/ItemSearchProviders/ItemSearchProvider";
import { ItemSearchProviders } from "../Models/ItemSearchProviders/ItemSearchProviders";
import Model from "../Models/Definition/Model";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import SearchableItemTraits from "../Traits/TraitsClasses/SearchableItemTraits";

type MixinModel = Model<SearchableItemTraits & MappableTraits>;

export type ItemSelectionDisposer = () => void;

/**
 * This mixin adds capability for searching a catalog item using an {@link
 * ItemSearchProvider}.
 */
function SearchableItemMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class Klass extends Base {
    readonly hasSearchableItemMixin = true;

    /**
     * A hook for highlighting features in item search results.
     *
     * @param results The search results to be highlighted.
     */
    abstract highlightFeaturesFromItemSearchResults(
      results: ItemSearchResult[]
    ): ItemSelectionDisposer;

    /**
     * A hook for hiding features not in item search results.
     *
     * @param results The search results to be hidden.
     */
    abstract hideFeaturesNotInItemSearchResults(
      results: ItemSearchResult[]
    ): ItemSelectionDisposer;

    /**
     * A method implementing zoom to behavior for results.
     *
     */
    abstract zoomToItemSearchResult(result: ItemSearchResult): void;

    /**
     * Returns true if this item is searchable and has a valid item search provider defined.
     */
    @computed
    get canSearch(): boolean {
      return this.search.providerType
        ? ItemSearchProviders.has(this.search.providerType)
        : false;
    }

    /**
     * Returns an instance of the ItemSearchProvider for searching the item.
     */
    @action
    createItemSearchProvider(): ItemSearchProvider | undefined {
      const klass =
        this.search.providerType &&
        ItemSearchProviders.get(this.search.providerType);
      if (!klass) return;
      return new klass(this.search.providerOptions, this.search.parameters);
    }
  }
  return Klass;
}

namespace SearchableItemMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof SearchableItemMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasSearchableItemMixin;
  }
}

export default SearchableItemMixin;
