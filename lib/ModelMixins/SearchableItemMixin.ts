import { action, computed } from "mobx";
import Constructor from "../Core/Constructor";
import ItemSearchProvider, {
  ItemSearchResult
} from "../Models/ItemSearchProvider";
import ItemSearchProviders from "../Models/ItemSearchProviders";
import Model from "../Models/Model";
import SearchableItemTraits from "../Traits/SearchableItemTraits";

type MixinModel = Model<SearchableItemTraits>;

function SearchableItemMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class Klass extends Base {
    readonly hasSearchableItemMixin = true;

    abstract selectItemSearchResult(result: ItemSearchResult): void;
    abstract unselectItemSearchResult(result: ItemSearchResult): void;

    @computed
    get canSearch(): boolean {
      return this.search.providerType
        ? ItemSearchProviders.has(this.search.providerType)
        : false;
    }

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
