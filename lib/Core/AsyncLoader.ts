import { observable, computed, runInAction, toJS } from "mobx";

export default class AsyncLoader {
  @observable
  private _isLoading: boolean = false;

  @observable
  private _forceReloadCount: number = 0;

  private _promise: Promise<void> | undefined = undefined;

  @computed({ keepAlive: true })
  private get loadKeepAlive(): Promise<void> {
    // Do don't do anything with _forceReloadCount directly, but
    // by accessing it we will cause a new load to be triggered
    // when it changes.
    toJS(this._forceReloadCount);
    return this.loadCallback();
  }

  constructor(readonly loadCallback: () => Promise<void>) {}

  /**
   * Gets a value indicating whether we are currently loading.
   */
  get isLoading(): boolean {
    return this._isLoading;
  }

  load(forceReload: boolean = false): Promise<void> {
    if (forceReload) {
      ++this._forceReloadCount;
    }

    const newPromise = this.loadKeepAlive;
    if (newPromise !== this._promise) {
      if (this._promise) {
        // TODO - cancel old promise
        //this._metadataPromise.cancel();
      }

      this._promise = newPromise;

      runInAction(() => {
        this._isLoading = true;
      });
      newPromise
        .then(result => {
          runInAction(() => {
            this._isLoading = false;
          });
          return result;
        })
        .catch(e => {
          runInAction(() => {
            this._isLoading = false;
          });
          throw e;
        });
    }

    return newPromise;
  }
}
