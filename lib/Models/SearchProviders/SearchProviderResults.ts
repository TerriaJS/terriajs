import { makeObservable, observable } from "mobx";
import SearchProviderMixin from "../../ModelMixins/SearchProviders/SearchProviderMixin";
import SearchResult from "./SearchResult";

export default class SearchProviderResults<
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
  @observable isSearching: boolean = false;
  isCanceled = false;

  constructor(readonly searchProvider: SeachProviderType) {
    makeObservable(this);
  }
}
