import { computed, createAtom, trace, action, transaction } from "mobx";

export default abstract class LoadableStratum<T> {
    // We manually use atoms to avoid MobX complaining about a
    // computed modifying an observable.
    private _isLoadingAtom = createAtom('isLoadingAtom', () => {}, () => {});
    private _isLoading = false;

    private _loadPromiseAtom = createAtom('loadPromise', () => {}, () => {});
    private _loadPromise: Promise<void> | undefined = undefined;

    /**
     * Implemented in the derived class to load the stratum asynchronously. Any observables accessed during the synchronous invocation
     * of this method (but _not_ during any promise resolutions or other asynchronous operations) will, if and when they change,
     * automatically trigger a reload. This method should _not_ mutate the instance directly. Instead, it should return a value
     * representing the result of the load. That value will be passed to {@link LoadableStratum<T>#applyLoad} where it can be applied
     * to the instance. The `load` method is called in the same MobX transaction in which the {@link LoadableStratum<T>#isLoading}
     * flag is set to true.
     *
     * @returns A promise that resolves to a loaded value, which is to be applied with a call to {@link LoadableStratum<T>#applyLoad}.
     */
    protected abstract load(): Promise<T>;

    /**
     * Implemented in the derived class to apply a loaded value to this instance. This is called inside the same MobX action in which the
     * {@link LoadableStratum<T>#isLoading} flag is set to false.
     *
     * @param loadResult The load result to apply to this instance.
     */
    protected abstract applyLoad(loadResult: T): void;

    /**
     * Gets a value indicating whether loading is in progress. Accessing this property will
     * _not_ automatically trigger loading.
     */
    get isLoading(): boolean {
        this._isLoadingAtom.reportObserved();
        return this._isLoading;
    }

    /**
     * Gets a promise that will resolve when the load process completes, or reject if there
     * is an error during load. Accessing this property will _not_ automatically trigger loading.
     */
    get loadPromise(): Promise<void> | undefined {
        this._loadPromiseAtom.reportObserved();
        return this._loadPromise;
    }

    /**
     * Initiates loading if loading is necessary and returns the promise that will resolve when loading is complete.
     * If loading is already in progress or complete, the previous promise will be returned without initiating a new
     * load. If loading was initiated, {@link LoadableStratum<T>#isLoading} will be `true` upon return of this method.
     * When the promise resolves or rejects, {@link LoadableStratum<T>#isLoading} will already be `false`. The
     * returned promise may already be resolved when this method returns.
     * @returns The promise that resolves when the load is complete. It may already be resolved when this method returns.
     */
    loadIfNeeded(): Promise<void> {
        return this.loadPromiseAndTriggerLoad;
    }

    @computed({
        requiresReaction: true
    })
    private get loadPromiseAndTriggerLoad() {
        trace(true);

        transaction(() => {
            if (!this._isLoading) {
                this._isLoading = true;
                this._isLoadingAtom.reportChanged();
            }

            this._loadPromise = this.load().then(this.loadSuccess).catch(this.loadFailure);

            this._loadPromiseAtom.reportChanged();
        });

        return <Promise<void>>this._loadPromise;
    }

    @action.bound
    private loadSuccess(loadResult: T): void {
        if (this._isLoading) {
            this.applyLoad(loadResult);
            this._isLoading = false;
            this._isLoadingAtom.reportChanged();
        }
    }

    @action.bound
    private loadFailure(e: any): void {
        if (this._isLoading) {
            this._isLoading = false;
            this._isLoadingAtom.reportChanged();
        }
        throw e;
    }
}
