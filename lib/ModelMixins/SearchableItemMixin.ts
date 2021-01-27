import { action, computed } from "mobx";
import Constructor from "../Core/Constructor";
import { ItemSearchProviders } from "../Models/ItemSearchProviders";
import ItemSearchProvider, {
  ItemSearchResult
} from "../Models/ItemSearchProvider";
import Model from "../Models/Model";
import SearchableItemTraits from "../Traits/SearchableItemTraits";

type MixinModel = Model<SearchableItemTraits>;

/**
 * This mixin adds capability for searching a catalog item using an {@link
 * ItemSearchProvider}.
 */
function SearchableItemMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class Klass extends Base {
    readonly hasSearchableItemMixin = true;

    /**
     * Callback when a search result is selected by the user.
     *
     * The implementation can decide how to highlight the search result.
     *
     * @param result The selected search result.
     */
    abstract selectItemSearchResult(result: ItemSearchResult): void;

    /**
     * Callback when user un-selects a search result.
     *
     * This provides a chance to reverse the highlighting and changes made
     * during the call to {@selectItemSearchResult}
     *
     * @param result The un-selected search result.
     */
    abstract unselectItemSearchResult(result: ItemSearchResult): void;

    /**
     * An optional implementation for zooming in to results.
     *
     * @param result The search result to zoom to.
     */
    zoomToItemSearchResult?: (result: ItemSearchResult) => void;

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
      return new klass(this.search.options);
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
