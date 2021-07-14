import SearchableItemMixin from "../../../../lib/ModelMixins/SearchableItemMixin";
import CreateModel from "../../../../lib/Models/Definition/CreateModel";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProviders/ItemSearchProvider";
import MappableTraits from "../../../../lib/Traits/TraitsClasses/MappableTraits";
import mixTraits from "../../../../lib/Traits/mixTraits";
import SearchableItemTraits from "../../../../lib/Traits/TraitsClasses/SearchableItemTraits";

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
