import { action, computed } from "mobx";
import { fromPromise } from "mobx-utils";
import Constructor from "../../Core/Constructor";
import isDefined from "../../Core/isDefined";
import Model from "../../Models/Definition/Model";
import SearchProviderResults from "../../Models/SearchProviders/SearchProviderResults";
import SearchProviderTraits from "../../Traits/SearchProviders/SearchProviderTraits";

type SearchProviderModel = Model<SearchProviderTraits>;

function SearchProviderMixin<T extends Constructor<SearchProviderModel>>(
  Base: T
) {
  abstract class SearchProviderMixin extends Base {
    abstract get type(): string;

    protected abstract logEvent(searchText: string): void;

    protected abstract doSearch(
      searchText: string,
      results: SearchProviderResults
    ): Promise<void>;

    @action
    search(searchText: string): SearchProviderResults {
      const result = new SearchProviderResults(this);
      if (!this.shouldRunSearch(searchText)) {
        result.resultsCompletePromise = fromPromise(Promise.resolve());
        result.message = {
          content: "translate#viewModels.searchMinCharacters",
          params: {
            count: this.minCharacters
          }
        };
        return result;
      }
      this.logEvent(searchText);
      result.resultsCompletePromise = fromPromise(
        this.doSearch(searchText, result)
      );
      return result;
    }

    private shouldRunSearch(searchText: string) {
      if (
        searchText === undefined ||
        /^\s*$/.test(searchText) ||
        (this.minCharacters && searchText.length < this.minCharacters) ||
        (this.minCharacters === undefined &&
          searchText.length <
            this.terria.configParameters.searchBar!.minCharacters)
      ) {
        return false;
      }
      return true;
    }

    get hasSearchProviderMixin() {
      return true;
    }

    @computed get resultsAreReferences() {
      return isDefined(this.terria.catalogIndex);
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
