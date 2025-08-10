import { debounce } from "lodash-es";
import { action, makeObservable, observable } from "mobx";
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

    protected debounceTime = 1000;
    private _debouncedSearch: ReturnType<typeof debounce>;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
      this.result = new SearchProviderResults(this);

      // Create debounced search function
      this._debouncedSearch = debounce((searchText: string) => {
        this.performSearch(searchText);
      }, this.debounceTime);
    }

    @observable
    public result: SearchProviderResults;

    protected abstract logEvent(searchText: string): void;

    protected abstract doSearch(
      searchText: string,
      results: SearchProviderResults
    ): Promise<void>;

    @action
    cancelSearch() {
      // Cancel any pending debounced search
      this._debouncedSearch.cancel();

      this.result.isCanceled = true;
      this.result = new SearchProviderResults(this);
    }

    @action
    async search(
      searchText: string,
      manuallyTriggered?: boolean
    ): Promise<void> {
      this.result.isWaitingToStartSearch = true;
      if (!this.shouldRunSearch(searchText)) {
        // Cancel any pending search
        this._debouncedSearch.cancel();

        this.result.isSearching = false;
        this.result.message = {
          content: "translate#viewModels.searchMinCharacters",
          params: {
            count: this.minCharacters
          }
        };
        return;
      }

      // If manually triggered (e.g., Enter key), search immediately
      if (manuallyTriggered) {
        this._debouncedSearch.cancel(); // Cancel any pending debounced search
        await this.performSearch(searchText);
      } else {
        // Use debounced search for automatic searches (typing)
        await this._debouncedSearch(searchText);
      }
    }

    @action
    private async performSearch(searchText: string): Promise<void> {
      this.logEvent(searchText);
      this.result.isWaitingToStartSearch = false;
      this.result.isSearching = true;

      await this.doSearch(searchText, this.result);

      this.result.isSearching = false;
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
