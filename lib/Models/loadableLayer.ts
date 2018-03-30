import { computed, extendObservable, runInAction, trace } from 'mobx';

export interface LoadableLayerData {
    isLoading: boolean;
    loadPromise: Promise<void>;
}

function isPromise<T>(value: Promise<T> | T): value is Promise<T> {
    return value && typeof (<Promise<T>>value).then !== 'undefined'
}

export default function loadableLayer<T extends LoadableLayerData>(createInitialValue: () => T, load: (T) => Promise<void>): T {
    const value = createInitialValue();

    runInAction(() => {
        value.isLoading = true;
    });

    const loadResult = load(value);
    if (isPromise(loadResult)) {
        value.loadPromise = loadResult;
    } else {
        value.loadPromise = Promise.resolve(loadResult);
    }

    value.loadPromise.then(() => {
        runInAction(() => {
            value.isLoading = false;
        });
    }).catch(e => {
        runInAction(() => {
            value.isLoading = false;
        });
        throw e;
    });

    return value;
}
