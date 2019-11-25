import { observable, computed, runInAction, toJS, action } from "mobx";

export default class AsyncLoader {
  @observable
  private _isLoading: boolean = false;

  @observable
  private _forceReloadCount: number = 0;

  private _promise: Promise<void> | undefined = undefined;

  @computed({ keepAlive: true })
  private get loadKeepAlive(): Promise<void> {
    // We don't do much with _forceReloadCount directly, but by accessing it
    // we will cause a new load to be triggered when it changes. If it's value
    // is -1, we don't call the `loadCallback` at all, so this keepAlive'd
    // observable will no longer depend on anything, which avoids creating
    // a memory leak when this loader is no longer needed.
    if (this._forceReloadCount < 0) {
      if (this.disposeCallback) {
        return this.disposeCallback();
      } else {
        return Promise.resolve();
      }
    }

    return this.loadCallback();
  }

  constructor(
    readonly loadCallback: () => Promise<void>,
    readonly disposeCallback?: () => Promise<void>
  ) {}

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

          // Do not re-throw the exception because it's guaranteed to be
          // unhandled. We're returning the original `newPromise`, not the
          // result of the `.then` and `.catch` above.
        });
    }

    return newPromise;
  }

  /**
   * Disposes this loader, allowing the loaded resources to be garbage collected.
   * The loader can be resurrected and forced to load again by calling
   * `load(true)`.
   */
  @action
  dispose() {
    this._forceReloadCount = -1;
    this.load();
  }
}
