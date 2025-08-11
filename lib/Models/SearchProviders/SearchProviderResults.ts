import { computed, makeObservable, observable } from "mobx";
import SearchProviderMixin from "../../ModelMixins/SearchProviders/SearchProviderMixin";
import SearchResult from "./SearchResult";

export default class SearchProviderResult<
  SeachProviderType = SearchProviderMixin.Instance
> {
  @observable results: SearchResult[] = [];
  @observable message?: {
    content: string;
    params?: {
      [key: string]: string | number | undefined;
    };
  };
  @observable isWaitingToStartSearch: boolean = false;
  @observable _isSearching: boolean = false;
  isCanceled = false;

  constructor(readonly searchProvider: SeachProviderType) {
    makeObservable(this);
  }

  @computed
  get isSearching() {
    return this._isSearching;
  }

  set isSearching(value: boolean) {
    this._isSearching = value;
  }
}
