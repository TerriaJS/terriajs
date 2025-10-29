import { debounce } from "lodash-es";
import { action, makeObservable, observable } from "mobx";
import AbstractConstructor from "../../Core/AbstractConstructor";
import Model from "../../Models/Definition/Model";
import SearchProviderResult from "../../Models/SearchProviders/SearchProviderResults";
import SearchProviderTraits from "../../Traits/SearchProviders/SearchProviderTraits";

type SearchProviderModel = Model<SearchProviderTraits>;

function SearchProviderMixin<
  T extends AbstractConstructor<SearchProviderModel>
>(Base: T) {
  abstract class SearchProviderMixin extends Base {
    abstract get type(): string;

    protected debounceTime = 1000;
    private _debouncedSearch: ReturnType<typeof debounce>;

    // Store current AbortController
    private _currentAbortController?: AbortController;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
      this.searchResult = new SearchProviderResult(this);

      this._debouncedSearch = debounce((searchText: string) => {
        this.performSearch(searchText);
      }, this.debounceTime);
    }

    @observable
    public searchResult: SearchProviderResult;

    protected abstract logEvent(searchText: string): void;

    protected abstract doSearch(
      searchText: string,
      results: AbortSignal
    ): Promise<void>;

    @action
    cancelSearch() {
      this._debouncedSearch.cancel();

      this._currentAbortController?.abort();
      this._currentAbortController = undefined;

      this.searchResult.cancel();
    }

    @action
    async search(
      searchText: string,
      manuallyTriggered?: boolean
    ): Promise<void> {
      this.cancelSearch();
      if (searchText.length === 0) {
        return;
      }
      if (!this.shouldRunSearch(searchText)) {
        this.searchResult.state = "idle";
        this.searchResult.message = {
          content: "translate#viewModels.searchMinCharacters",
          params: {
            count: this.minCharacters
          }
        };
        return;
      }

      this.searchResult.state = "waiting";

      if (manuallyTriggered) {
        this._debouncedSearch.cancel();
        await this.performSearch(searchText);
      } else {
        await this._debouncedSearch(searchText);
      }
    }

    @action
    private async performSearch(searchText: string): Promise<void> {
      this.logEvent(searchText);
      this.searchResult.state = "searching";

      const abortController = new AbortController();
      this._currentAbortController = abortController;

      try {
        await this.doSearch(searchText, abortController.signal);

        if (abortController.signal.aborted) {
          return;
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          this.searchResult.cancel();
          throw error;
        }
      } finally {
        this.searchResult.state = "idle";
        if (this._currentAbortController === abortController) {
          this._currentAbortController = undefined;
        }
      }
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
