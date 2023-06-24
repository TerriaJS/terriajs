import { action, observable, makeObservable } from "mobx";
import { fromPromise } from "mobx-utils";
import SearchProviderResults from "./SearchProviderResults";

export default abstract class SearchProvider {
  constructor() {
    makeObservable(this);
  }

  /** If search results are References to models in terria.models - set this to true.
   * This is so groups/references are opened and loaded properly
   */
  get resultsAreReferences(): boolean {
    return false;
  }

  @observable name = "Unknown";
  @observable isOpen = true;

  @action
  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  @action
  search(searchText: string): SearchProviderResults {
    const result = new SearchProviderResults(this);
    result.resultsCompletePromise = fromPromise(
      this.doSearch(searchText, result)
    );
    return result;
  }

  protected abstract doSearch(
    searchText: string,
    results: SearchProviderResults
  ): Promise<void>;
}
