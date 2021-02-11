import { observable, runInAction, reaction } from "mobx";
import { fromPromise } from "mobx-utils";

export default class AsyncLoader {
  private isLoaded = false;

  @observable
  private _isLoading: boolean = false;

  private _promise: Promise<void> | undefined;

  constructor(readonly loadCallback: () => Promise<void>) {}

  /**
   * Gets a value indicating whether we are currently loading.
   */
  get isLoading(): boolean {
    return this._isLoading;
  }

  async load(forceReload: boolean = false) {
    if ((forceReload || !this.isLoaded) && !this.isLoading) {
      runInAction(() => {
        this._isLoading = true;
      });
      try {
        this._promise = this.loadCallback();
        await this._promise;
      } catch (r) {
        // Do not re-throw the exception because it's guaranteed to be
        // unhandled. We're returning the original `newPromise`, not the
        // result of the `.then` and `.catch` above.
      }
      runInAction(() => {
        this._isLoading = false;
        this.isLoaded = true;
      });
    } else if (this._promise) {
      await this._promise;
    }
  }
}
