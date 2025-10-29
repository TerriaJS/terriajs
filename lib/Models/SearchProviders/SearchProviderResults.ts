import { action, computed, makeObservable, observable } from "mobx";
import SearchProviderMixin from "../../ModelMixins/SearchProviders/SearchProviderMixin";
import SearchResult from "./SearchResult";

type SearchState = "searching" | "waiting" | "idle";

export default class SearchProviderResult<
  SearchProviderType = SearchProviderMixin.Instance
> {
  @observable _state: SearchState = "idle";
  @observable results: SearchResult[] = [];
  @observable message?: {
    content: string;
    params?: {
      [key: string]: string | number | undefined;
    };
  };

  constructor(readonly searchProvider: SearchProviderType) {
    makeObservable(this);
  }

  @computed
  get state() {
    return this._state;
  }

  set state(newState: SearchState) {
    this._state = newState;
  }

  @action
  clear() {
    this.results = [];
    this.message = undefined;
  }

  @action
  cancel() {
    this.state = "idle";
    this.clear();
  }

  @action
  errorOccurred() {
    this.state = "idle";
    this.results = [];
    this.message = {
      content: "translate#viewModels.searchErrorOccurred"
    };
  }

  setResults(results: SearchResult[]) {
    this.state = "idle";
    this.results = results;
    if (results.length === 0) {
      this.message = {
        content: "translate#viewModels.searchNoResults"
      };
    } else {
      this.message = undefined;
    }
    this.results = results;
  }

  noResults(message: string = "translate#viewModels.searchNoResults") {
    this.state = "idle";
    this.results = [];
    this.message = {
      content: message
    };
  }
}
