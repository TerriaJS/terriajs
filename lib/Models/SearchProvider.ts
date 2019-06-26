import { observable, action } from "mobx";

export default abstract class SearchProvider {
  @observable name = "Unknown";
  @observable isOpen = true;
  @observable searchResults: any[] = [];
  @observable searchMessage: string | undefined;

  @observable
  private _isSearching = false;

  constructor() {}

  get isSearching() {
    return this._isSearching;
  }

  @action
  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  @action
  search(searchText: string): Promise<void> {
    if (searchText && searchText.length > 0)
    this._isSearching = true;
    return this.doSearch(searchText).finally(() => {
      this._isSearching = false;
    });
  }

  protected abstract doSearch(searchText: string): Promise<void>;
}
