import SearchableItemMixin from "../../../../lib/ModelMixins/SearchableItemMixin";
import CreateModel from "../../../../lib/Models/Definition/CreateModel";
import mixTraits from "../../../../lib/Traits/mixTraits";
import MappableTraits from "../../../../lib/Traits/TraitsClasses/MappableTraits";
import SearchableItemTraits from "../../../../lib/Traits/TraitsClasses/SearchableItemTraits";

export default class MockSearchableItem extends SearchableItemMixin(
  CreateModel(mixTraits(SearchableItemTraits, MappableTraits))
) {
  highlightFeaturesFromItemSearchResults() {
    return () => {
      // no-op
    };
  }
  hideFeaturesNotInItemSearchResults() {
    return () => {
      // no-op
    };
  }
  zoomToItemSearchResult() {
    // no-op
  }
}
