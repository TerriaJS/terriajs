import SearchableItemMixin from "../../../../lib/ModelMixins/SearchableItemMixin";
import CreateModel from "../../../../lib/Models/CreateModel";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProvider";
import SearchableItemTraits from "../../../../lib/Traits/SearchableItemTraits";

export default class MockSearchableItem extends SearchableItemMixin(
  CreateModel(SearchableItemTraits)
) {
  highlightItemSearchResults(results: ItemSearchResult[]) {
    return () => {};
  }
  hideItemSearchResults(results: ItemSearchResult[]) {
    return () => {};
  }
}
