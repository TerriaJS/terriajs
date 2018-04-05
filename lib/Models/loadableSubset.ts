import { computed, createAtom, decorate, observable, runInAction } from 'mobx';

//>>includeStart('debug', pragmas.debug);
import { onBecomeUnobserved } from 'mobx';
//>>includeEnd('debug');

type Constructor<T> = new() => T;
type LoadableConstructor<T> = new(load: (T) => Promise<void>) => T;

export interface LoadableLayerData {
    isLoading: boolean;
    loadPromise: Promise<void>;
    loadIfNeeded(): Promise<void>;
}

/**
 * Creates a loadable layer class containing a subset of the properties in a model's definition. The layer is loaded asynchronously
 * via a provided load callback the first time any of the properties are accessed.
 *
 * @param definition
 * @param property1
 */
export default function loadableSubset<T, T1 extends keyof T>(definition: Constructor<T>, property1: T1): LoadableConstructor<LoadableLayerData & Pick<T, T1>>;
export default function loadableSubset<T, T1 extends keyof T, T2 extends keyof T>(definition: Constructor<T>, property1: T1, property2: T2): LoadableConstructor<LoadableLayerData & Pick<T, T1 | T2>>;
export default function loadableSubset<T, T1 extends keyof T, T2 extends keyof T, T3 extends keyof T>(definition: Constructor<T>, property1: T1, property2: T2, property3: T3): LoadableConstructor<LoadableLayerData & Pick<T, T1 | T2 | T3>>;
export default function loadableSubset<T, T1 extends keyof T, T2 extends keyof T, T3 extends keyof T>(definition: Constructor<T>, property1: T1, property2: T2, property3: T3): LoadableConstructor<LoadableLayerData & Pick<T, T1 | T2 | T3>>;
export default function loadableSubset(definition, ...properties): any {
    const valuesTemplate: any = {};
    properties.forEach(property => {
        valuesTemplate[property] = undefined;
    });

    class LoadableSubset {
        private _isLoadingAtom = createAtom('isLoadingAtom', () => {}, () => {});
        private _isLoading = false;

        constructor(private readonly loadFunction: (LoadableSubset) => Promise<void>) {
            //>>includeStart('debug', pragmas.debug);
            onBecomeUnobserved(this, '_privateValues', () => {
                console.info('A loaded subset is no longer being observed by anyone, which means that the previously-loaded values have been lost.');
            });
            //>>includeEnd('debug');
        }

        @computed({
            requiresReaction: true
        }) private get _privateValues() {
            const newValues = observable(valuesTemplate);

            runInAction(() => {
                if (!this._isLoading) {
                    this._isLoading = true;
                    this._isLoadingAtom.reportChanged();
                }
            });

            // TODO: it would be nice if we could cancel a previous load that
            // was started but not yet completed. But to do that we'll need
            // cancelable requests and (ideally) cancelable promises.
            newValues.loadPromise = this.loadFunction(newValues).then(() => {
                console.log('loadPromise: resolve');
                runInAction(() => {
                    if (this._isLoading) {
                        this._isLoading = false;
                        this._isLoadingAtom.reportChanged();
                    }
                });
            }).catch(e => {
                console.log('loadPromise: reject');
                runInAction(() => {
                    if (this._isLoading) {
                        this._isLoading = false;
                        this._isLoadingAtom.reportChanged();
                    }
                });
                throw e;
            });

            return newValues;
        }

        get loadPromise(): Promise<void> {
            return this._privateValues.loadPromise;
        }

        get isLoading(): boolean {
            this._isLoadingAtom.reportObserved();
            return this._isLoading;
        }

        loadIfNeeded() {
            return this.loadPromise;
        }
    }

    properties.forEach(property => {
        Object.defineProperty(LoadableSubset.prototype, property, {
            get: function() {
                return this._privateValues[property];
            },
            enumerable: true,
            configurable: true
        });
    });

    const decorators: any = {};
    properties.forEach(property => {
        decorators[property] = computed;
    });

    decorate(LoadableSubset, decorators);

    return LoadableSubset;
}
