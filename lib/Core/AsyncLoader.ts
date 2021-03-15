import {
  action,
  IReactionDisposer,
  IReactionPublic,
  observable,
  reaction,
  runInAction
} from "mobx";

export default class AsyncLoader<T> {
  @observable
  private _isLoading: boolean = false;

  private _promise: Promise<void> | undefined = undefined;

  private dependencyDisposer?: IReactionDisposer;

  private loadCallback: (() => Promise<void>) | undefined;
  private dependenciesChanged = false;

  constructor(
    readonly loadCallbackFn: () => () => Promise<void>,
    readonly disposeCallback?: () => Promise<void>
  ) {}

  load(forceReload: boolean = false): Promise<void> {
    if (!this.dependencyDisposer) {
      reaction(
        () => this.loadCallbackFn(),
        (loadCallback, effect) => {
          this.loadCallback = loadCallback;
          console.log(`updated loadcallback`);
          console.log(effect.trace());
          console.log(loadCallback);
          this.dependenciesChanged = true;
        },
        { fireImmediately: true }
      );
    }

    if (!this.loadCallback) {
      console.log(`loadCallback doesn't exist!!`);
      return Promise.resolve();
    }

    if (this._promise) return this._promise;

    if (forceReload || this.dependenciesChanged) {
      this.dependenciesChanged = false;
    }

    runInAction(() => {
      this._isLoading = true;
    });

    console.log("loading");
    console.log(this);

    this._promise = this.loadCallback();

    this._promise
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

    return this._promise;
  }

  /**
   * Gets a value indicating whether we are currently loading.
   */
  get isLoading(): boolean {
    return this._isLoading;
  }

  /**
   * Disposes this loader, allowing the loaded resources to be garbage collected.
   * The loader can be resurrected and forced to load again by calling
   * `load(true)`.
   */
  @action
  dispose() {
    this._promise = undefined;
    if (this.dependencyDisposer) this.dependencyDisposer();
  }
}
