import SearchableItemMixin from "../../../../lib/ModelMixins/SearchableItemMixin";
import CreateModel from "../../../../lib/Models/CreateModel";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProvider";
import MappableTraits from "../../../../lib/Traits/MappableTraits";
import mixTraits from "../../../../lib/Traits/mixTraits";
import SearchableItemTraits from "../../../../lib/Traits/SearchableItemTraits";

export default class MockSearchableItem extends SearchableItemMixin(
  CreateModel(mixTraits(SearchableItemTraits, MappableTraits))
) {
  highlightFeaturesFromItemSearchResults(results: ItemSearchResult[]) {
    return () => {};
  }
  hideFeaturesNotInItemSearchResults(results: ItemSearchResult[]) {
    return () => {};
  }
  zoomToItemSearchResult(result: ItemSearchResult) {}
}
