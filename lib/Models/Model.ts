import { ObservableMap, computed, decorate, observable, trace } from 'mobx';
import DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';
import Constructor from '../Core/Constructor';
import Trait from '../Traits/Trait';
import ModelTraits from '../Traits/ModelTraits';
import { ModelId } from '../Traits/ModelReference';
import StratumOrder from './StratumOrder';
import Terria from './Terria';
import LoadableStratum from '../../test/Models/LoadableStratum';
import WithStrata from '../Interfaces/WithStrata';
import OrUndefined from '../Core/OrUndefined';

export interface TraitsConstructor<T extends ModelTraits> {
    new(...args: any[]): T;
    prototype: T;
    traits: {
        [key: string]: Trait;
    }
}

export interface ModelConstructor<T> {
    new(id: string, terria: Terria): T;
    prototype: T;
}

export abstract class BaseModel {
    abstract get type(): string;
    abstract get traits(): {
        [id: string]: Trait;
    };
    abstract get flattened(): Model.StratumFromTraits<ModelTraits>;
    abstract get strata(): ObservableMap<string, Model.StratumFromTraits<ModelTraits>>;
    abstract get topStratum(): Model.StratumFromTraits<ModelTraits>;
    abstract get isLoading(): boolean;
    abstract get loadPromise(): Promise<{}>;

    constructor(readonly id: ModelId, readonly terria: Terria) {
    }

    abstract getOrCreateStratum(id: string): Model.StratumFromTraits<ModelTraits>;

    abstract get strataTopToBottom(): Model.StratumFromTraits<ModelTraits>[];
    abstract get strataBottomToTop(): Model.StratumFromTraits<ModelTraits>[];
    abstract createStratumInstance(): Model.StratumFromTraits<ModelTraits>;
}

export interface ModelInterface<T extends ModelTraits> extends WithStrata<T> {
    readonly type: string;
    readonly traits: {
        [id: string]: Trait;
    };
    readonly flattened: Model.MakeReadonly<T>;
    readonly strata: ObservableMap<string, Model.StratumFromTraits<T>>;
    readonly terria: Terria;
    readonly id: string;
    readonly isLoading: boolean;
    readonly loadPromise: Promise<{}>;

    getOrCreateStratum(id: string): Model.StratumFromTraits<T>;

    readonly strataTopToBottom: Model.StratumFromTraits<T>[];
    readonly strataBottomToTop: Model.StratumFromTraits<T>[];
    readonly topStratum: Model.StratumFromTraits<T>;
    createStratumInstance(): Model.StratumFromTraits<T>;
}

function Model<T extends TraitsConstructor<ModelTraits>>(Traits: T): ModelConstructor<ModelInterface<InstanceType<T>> & Model.InterfaceFromTraits<InstanceType<T>>> {
    abstract class Model extends BaseModel implements ModelInterface<T> {
        abstract get type(): string;
        static readonly traits = Traits.traits;
        readonly traits = Traits.traits;
        readonly flattened: Model.MakeReadonly<T>;
        readonly strata = observable.map<string, Model.StratumFromTraits<T>>();

        constructor(id: ModelId, terria: Terria) {
            super(id, terria);
            this.flattened = observable(createFlattenedLayer(this, Traits));
        }

        getOrCreateStratum(id: string): Model.StratumFromTraits<T> {
            let result = this.strata.get(id);
            if (!result) {
                result = this.createStratumInstance();
                this.strata.set(id, result);
            }
            return result;
        }

        @computed
        get strataTopToBottom() {
            trace();
            return StratumOrder.sortTopToBottom(this.strata);
        }

        @computed
        get strataBottomToTop() {
            return StratumOrder.sortBottomToTop(this.strata);
        }

        @computed
        get topStratum() {
            return this.strataTopToBottom[0];
        }

        get isLoading(): boolean {
            for (const stratum of this.strata.values()) {
                if (stratum instanceof LoadableStratum && stratum.isLoading) {
                    return true;
                }
            }
            return false;
        }

        get loadPromise(): Promise<{}> {
            const promises = [];

            for (const stratum of this.strata.values()) {
                if (stratum instanceof LoadableStratum) {
                    const loadPromise = stratum.loadPromise;
                    if (loadPromise !== undefined) {
                        promises.push(loadPromise);
                    }
                }
            }

            return Promise.all(promises);
        }

        createStratumInstance(): Model.StratumFromTraits<T> {
            const traits = Traits.traits;
            const propertyNames = Object.keys(traits);
            const reduced: any = propertyNames.reduce((p, c) => ({ ...p, [c]: undefined }), {});
            return observable(reduced);
        }
    }

    const decorators: any = {};

    // Add top-level accessors that don't already exist.
    const traits = Traits.traits;
    Object.keys(traits).forEach(propertyName => {
        if (!(propertyName in Model.prototype)) {
            Object.defineProperty(Model.prototype, propertyName, {
                get: function(this: Model) {
                    return (<any>this.flattened)[propertyName];
                },
                enumerable: true,
                configurable: true
            });

            decorators[propertyName] = computed;
        }
    });

    decorate(Model, decorators);

    function createFlattenedLayer<T extends TraitsConstructor<ModelTraits>>(model: Model, Traits: T) {
        const traits = Traits.traits;

        const flattened: any = {
            id: model.id + ':flattened'
        };

        Object.keys(traits).forEach(propertyName => {
            const property = traits[propertyName];

            Object.defineProperty(flattened, propertyName, {
                get: function() {
                    return property.getValue(model.strataTopToBottom);
                },
                enumerable: true
            });
        });

        return flattened;
    }

    return <any>Model;
}

namespace Model {
    export type MakeReadonly<TDefinition extends ModelTraits> = {
        readonly [P in keyof TDefinition]-?: (Exclude<TDefinition[P], undefined> extends Array<infer TElement> ?
            ReadonlyArray<Readonly<TElement>> :
            TDefinition[P] extends ModelTraits ?
                MakeReadonly<TDefinition[P]> :
                Readonly<TDefinition[P]>) | undefined;
    };

    export type InterfaceFromTraits<TDefinition extends ModelTraits> = OrUndefined<MakeReadonly<Required<TDefinition>>>;
    export type StratumFromTraits<TDefinition extends ModelTraits> = OrUndefined<Required<TDefinition>>;
}

export default Model;
