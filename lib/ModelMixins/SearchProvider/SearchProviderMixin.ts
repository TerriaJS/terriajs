import { action } from "mobx";
import { fromPromise } from "mobx-utils";
import Constructor from "../../Core/Constructor";
import Model from "../../Models/Model";
import SearchProviderResults from "../../Models/SearchProvider/SearchProviderResults";
import SearchProviderTraits from "../../Traits/SearchProvider/SearchProviderTraits";

type SearchProviderModel = Model<SearchProviderTraits>;

function SearchProviderMixin<T extends Constructor<SearchProviderModel>>(
  Base: T
) {
  abstract class SearchProviderMixin extends Base {
    abstract get type(): string;

    @action
    search(searchText: string): SearchProviderResults {
      const result = new SearchProviderResults(this);
      result.resultsCompletePromise = fromPromise(
        this.doSearch(searchText, result)
      );
      return result;
    }

    protected abstract doSearch(
      searchText: string,
      results: SearchProviderResults
    ): Promise<void>;

    shouldRunSearch(searchText: string) {
      if (
        searchText === undefined ||
        /^\s*$/.test(searchText) ||
        (this.minCharacters && searchText.length < this.minCharacters) ||
        (this.minCharacters === undefined &&
          searchText.length <
            this.terria.configParameters.searchBar.minCharacters)
      ) {
        return false;
      }
      return true;
    }

    get hasSearchProviderMixin() {
      return true;
    }
  }
  return SearchProviderMixin;
}

namespace SearchProviderMixin {
  export interface SearchProviderMixin
    extends InstanceType<ReturnType<typeof SearchProviderMixin>> {}
  export function isMixedInto(model: any): model is SearchProviderMixin {
    return model && model.hasSearchProviderMixin;
  }
}

export default SearchProviderMixin;
