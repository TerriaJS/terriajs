import { action, observable } from "mobx";
import { fromPromise } from "mobx-utils";
import SearchProviderResults from "./SearchProviderResults";

export default abstract class SearchProvider {
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
