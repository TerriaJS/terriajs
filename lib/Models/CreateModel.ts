import { computed, decorate, observable, trace } from 'mobx';
import LoadableStratum from '../../test/Models/LoadableStratum';
import { ModelId } from '../Traits/ModelReference';
import ModelTraits from '../Traits/ModelTraits';
import TraitsConstructor from '../Traits/TraitsConstructor';
import createStratumInstance from './createStratumInstance';
import FlattenedFromTraits from './FlattenedFromTraits';
import Model, { BaseModel, ModelConstructor, ModelInterface } from './Model';
import StratumFromTraits from './StratumFromTraits';
import StratumOrder from './StratumOrder';
import Terria from './Terria';

export default function CreateModel<T extends TraitsConstructor<ModelTraits>>(Traits: T): ModelConstructor<Model<InstanceType<T>>> {
    abstract class Model extends BaseModel implements ModelInterface<InstanceType<T>> {
        abstract get type(): string;
        static readonly traits = Traits.traits;
        readonly traits = Traits.traits;
        readonly flattened: FlattenedFromTraits<InstanceType<T>>;
        readonly strata = observable.map<string, StratumFromTraits<InstanceType<T>>>();

        constructor(id: ModelId, terria: Terria) {
            super(id, terria);
            this.flattened = observable(createFlattenedLayer(this, Traits));
        }

        private getOrCreateStratum(id: string): StratumFromTraits<InstanceType<T>> {
            let result = this.strata.get(id);
            if (!result) {
                result = createStratumInstance(Traits);
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

        setTrait<Key extends keyof StratumFromTraits<InstanceType<T>>>(stratumId: string, trait: Key, value: StratumFromTraits<InstanceType<T>>[Key]): void {
            this.getOrCreateStratum(stratumId)[trait] = value;
        }

        getTrait<Key extends keyof StratumFromTraits<InstanceType<T>>>(stratumId: string, trait: Key): StratumFromTraits<InstanceType<T>>[Key] {
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
