import { observable, computed, runInAction } from "mobx";

export default class AsyncLoader {
  @observable
  private _isLoading: boolean = false;

  private _promise: Promise<void> | undefined = undefined;

  @computed({ keepAlive: true })
  private get loadKeepAlive(): Promise<void> {
    return this.loadCallback();
  }

  constructor(readonly loadCallback: () => Promise<void>) {}

  /**
   * Gets a value indicating whether we are currently loading.
   */
  get isLoading(): boolean {
    return this._isLoading;
  }

  load(): Promise<void> {
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
