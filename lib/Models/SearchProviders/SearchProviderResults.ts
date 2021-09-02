import { observable } from "mobx";
import { fromPromise, IPromiseBasedObservable } from "mobx-utils";
import SearchProviderMixin from "../../ModelMixins/SearchProviders/SearchProviderMixin";
import SearchResult from "./SearchResult";

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
