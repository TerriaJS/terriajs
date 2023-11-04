import { action, makeObservable } from "mobx";
import { fromPromise } from "mobx-utils";
import AbstractConstructor from "../../Core/AbstractConstructor";
import Model from "../../Models/Definition/Model";
import SearchProviderResults from "../../Models/SearchProviders/SearchProviderResults";
import SearchProviderTraits from "../../Traits/SearchProviders/SearchProviderTraits";

type SearchProviderModel = Model<SearchProviderTraits>;

function SearchProviderMixin<
  T extends AbstractConstructor<SearchProviderModel>
>(Base: T) {
  abstract class SearchProviderMixin extends Base {
    abstract get type(): string;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

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
        (this.minCharacters && searchText.length < this.minCharacters)
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
  export interface Instance
    extends InstanceType<ReturnType<typeof SearchProviderMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasSearchProviderMixin;
  }
}

export default SearchProviderMixin;
