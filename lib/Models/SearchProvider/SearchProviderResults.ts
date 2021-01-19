import { observable } from "mobx";
import SearchResult from "./SearchResult";
import { IPromiseBasedObservable, fromPromise } from "mobx-utils";
import SearchProviderMixin from "./../../ModelMixins/SearchProviderMixin";

export default class SearchProviderResults {
  @observable results: SearchResult[] = [];
  @observable message: string | undefined;
  isCanceled = false;
  resultsCompletePromise: IPromiseBasedObservable<void> = fromPromise(
    Promise.resolve()
  );

  constructor(
    readonly searchProvider: SearchProviderMixin.SearchProviderMixin
  ) {}

  get isSearching() {
    return this.resultsCompletePromise.state === "pending";
  }
}
