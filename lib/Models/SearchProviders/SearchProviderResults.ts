import { makeObservable, observable } from "mobx";
import { IPromiseBasedObservable, fromPromise } from "mobx-utils";
import SearchProviderMixin from "../../ModelMixins/SearchProviders/SearchProviderMixin";
import SearchResult from "./SearchResult";
import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";

export default class SearchProviderResults {
  @observable results: SearchResult[] = [];
  @observable message?: {
    content: string;
    params?: {
      [key: string]: string | number | undefined;
    };
  };
  @observable isWaitingToStartSearch: boolean = true;
  isCanceled = false;
  resultsCompletePromise: IPromiseBasedObservable<void> = fromPromise(
    Promise.resolve()
  );

  constructor(
    readonly searchProvider:
      | SearchProviderMixin.Instance
      | LocationSearchProviderMixin.Instance
  ) {
    makeObservable(this);
  }

  get isSearching() {
    return this.resultsCompletePromise.state === "pending";
  }
}
