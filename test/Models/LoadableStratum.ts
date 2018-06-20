import { computed, createAtom, runInAction } from "mobx";

export default abstract class LoadableStratum {
    // We manually use atoms to avoid MobX complaining about a
    // computed modifying an observable.
    private _isLoadingAtom = createAtom('isLoadingAtom', () => {}, () => {});
    private _isLoading = false;

    private _loadPromiseAtom = createAtom('loadPromise', () => {}, () => {});
    private _loadPromise: Promise<void> | undefined = undefined;

    abstract load(): Promise<void>;

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

    loadIfNeeded(): Promise<void> {
        return this.loadPromiseAndTriggerLoad;
    }

    @computed
    private get loadPromiseAndTriggerLoad() {
        runInAction(() => {
            if (!this._isLoading) {
                this._isLoading = true;
                this._isLoadingAtom.reportChanged();
            }
        });

        this._loadPromise = this.load().then(() => {
            runInAction(() => {
                if (this._isLoading) {
                    this._isLoading = false;
                    this._isLoadingAtom.reportChanged();
                }
            });
        }).catch(e => {
            runInAction(() => {
                if (this._isLoading) {
                    this._isLoading = false;
                    this._isLoadingAtom.reportChanged();
                }
            });
            throw e;
        });

        runInAction(() => {
            this._loadPromiseAtom.reportChanged();
        });

        return this._loadPromise;
    }
}
