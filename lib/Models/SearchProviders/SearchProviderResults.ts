import { observable, makeObservable } from "mobx";
import { fromPromise, IPromiseBasedObservable } from "mobx-utils";
import SearchProviderMixin from "../../ModelMixins/SearchProviders/SearchProviderMixin";
import SearchResult from "./SearchResult";

export default class SearchProviderResults {
  @observable results: SearchResult[] = [];
  @observable message?: {
    content: string;
    params?: {
      [key: string]: string | number | undefined;
    };
  };
  isCanceled = false;
  resultsCompletePromise: IPromiseBasedObservable<void> = fromPromise(
    Promise.resolve()
  );

  constructor(
    readonly searchProvider: SearchProviderMixin.SearchProviderMixin
  ) {
    makeObservable(this);
  }

  get isSearching() {
    return this.resultsCompletePromise.state === "pending";
  }
}
