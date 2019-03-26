import { computed, decorate, observable, ObservableMap, trace } from 'mobx';
import LoadableStratum from '../../test/Models/LoadableStratum';
import StratumFromTraits from './StratumFromTraits';
import WithStrata from '../ModelInterfaces/WithStrata';
import { ModelId } from '../Traits/ModelReference';
import ModelTraits from '../Traits/ModelTraits';
import Trait from '../Traits/Trait';
import ModelPropertiesFromTraits from './ModelPropertiesFromTraits';
import StratumOrder from './StratumOrder';
import Terria from './Terria';
import OrUndefined from '../Core/OrUndefined';
import FlattenedFromTraits from './FlattenedFromTraits';
import createStratumInstance from './createStratumInstance';

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
    abstract get flattened(): FlattenedFromTraits<ModelTraits>;
    abstract get strata(): ObservableMap<string, StratumFromTraits<ModelTraits>>;
    abstract get topStratum(): StratumFromTraits<ModelTraits>;
    abstract get isLoading(): boolean;
    abstract get loadPromise(): Promise<{}>;

    constructor(readonly id: ModelId, readonly terria: Terria) {
    }

    abstract getOrCreateStratum(id: string): StratumFromTraits<ModelTraits>;

    abstract get strataTopToBottom(): StratumFromTraits<ModelTraits>[];
    abstract get strataBottomToTop(): StratumFromTraits<ModelTraits>[];
    abstract createStratumInstance(): StratumFromTraits<ModelTraits>;
}

export interface ModelInterface<T extends ModelTraits> {
    readonly type: string;
    readonly traits: {
        [id: string]: Trait;
    };
    readonly flattened: FlattenedFromTraits<T>;
    readonly strata: ObservableMap<string, StratumFromTraits<T>>;
    readonly terria: Terria;
    readonly id: string;
    readonly isLoading: boolean;
    readonly loadPromise: Promise<{}>;

    getOrCreateStratum(id: string): StratumFromTraits<T>;

    readonly strataTopToBottom: StratumFromTraits<T>[];
    readonly strataBottomToTop: StratumFromTraits<T>[];
    readonly topStratum: StratumFromTraits<T>;
    createStratumInstance(): StratumFromTraits<T>;

    setTrait<Key extends keyof StratumFromTraits<T>>(stratumId: string, trait: Key, value: StratumFromTraits<T>[Key]): void;
    getTrait<Key extends keyof StratumFromTraits<T>>(stratumId: string, trait: Key): StratumFromTraits<T>[Key];
}

function Model<T extends TraitsConstructor<ModelTraits>>(Traits: T): ModelConstructor<ModelInterface<InstanceType<T>> & ModelPropertiesFromTraits<InstanceType<T>>> {
    abstract class Model extends BaseModel implements ModelInterface<T> {
        abstract get type(): string;
        static readonly traits = Traits.traits;
        readonly traits = Traits.traits;
        readonly flattened: FlattenedFromTraits<T>;
        readonly strata = observable.map<string, StratumFromTraits<T>>();

        constructor(id: ModelId, terria: Terria) {
            super(id, terria);
            this.flattened = observable(createFlattenedLayer(this, Traits));
        }

        getOrCreateStratum(id: string): StratumFromTraits<T> {
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

        createStratumInstance(): StratumFromTraits<T> {
            return createStratumInstance<T>(Traits);
        }

        setTrait<Key extends keyof StratumFromTraits<T>>(stratumId: string, trait: Key, value: StratumFromTraits<T>[Key]): void {
            this.getOrCreateStratum(stratumId)[trait] = value;
        }

        getTrait<Key extends keyof StratumFromTraits<T>>(stratumId: string, trait: Key): StratumFromTraits<T>[Key] {
            return this.getOrCreateStratum(stratumId)[trait];
        }
    }

    const decorators: any = {};

    // Add top-level accessors that don't already exist.
    const traits = Traits.traits;
    const traitsInstance = new Traits();
    Object.keys(traits).forEach(propertyName => {
        if (!(propertyName in Model.prototype)) {
            const defaultValue = (<any>traitsInstance)[propertyName];
            Object.defineProperty(Model.prototype, propertyName, {
                get: function(this: Model) {
                    const value = (<any>this.flattened)[propertyName];
                    if (value === undefined) {
                        return defaultValue;
                    }
                    return value;
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

export default Model;
