import SearchableItemMixin from "../../../../lib/ModelMixins/SearchableItemMixin";
import CreateModel from "../../../../lib/Models/CreateModel";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProvider";
import mixTraits from "../../../../lib/Traits/mixTraits";
import SearchableItemTraits from "../../../../lib/Traits/SearchableItemTraits";
import ShowableTraits from "../../../../lib/Traits/ShowableTraits";

export default class MockSearchableItem extends SearchableItemMixin(
  CreateModel(mixTraits(SearchableItemTraits, ShowableTraits))
) {
  highlightFeaturesFromItemSearchResults(results: ItemSearchResult[]) {
    return () => {};
  }
  hideFeaturesNotInItemSearchResults(results: ItemSearchResult[]) {
    return () => {};
  }
}
