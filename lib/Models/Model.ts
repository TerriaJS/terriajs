import { ObservableMap, computed, decorate, observable } from 'mobx';
import * as DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';
import Constructor from '../Core/Constructor';
import Trait from '../Traits/Trait';
import ModelTraits from '../Traits/ModelTraits';
import { ModelId } from '../Traits/ModelReference';
import StratumOrder from './StratumOrder';
import Terria from './TerriaNew';

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

export class BaseModel {
    constructor(readonly id: ModelId, readonly terria: Terria) {
    }
}

export interface ModelInterface<T> {
    readonly type: string;
    readonly traits: {
        [id: string]: Trait;
    };
    readonly flattened: Model.MakeReadonly<T>;
    readonly strata: ObservableMap<string, Partial<T>>;
    readonly terria: Terria;
    readonly id: string;

    addStratum(id: string): Partial<T>;

    readonly strataTopToBottom: Partial<T>[];
    readonly strataBottomToTop: Partial<T>[];
    createTraitsInstance(): Partial<T>;
}

function Model<T extends TraitsConstructor<ModelTraits>>(Traits: T): ModelConstructor<ModelInterface<InstanceType<T>> & Model.InterfaceFromTraits<InstanceType<T>>> {
    abstract class Model extends BaseModel implements ModelInterface<T> {
        abstract get type(): string;
        readonly traits = Traits.traits;
        readonly flattened: Model.MakeReadonly<T>;
        readonly strata = observable.map<string, Partial<T>>();

        constructor(readonly id: ModelId, readonly terria: Terria) {
            super(id, terria);
            this.flattened = observable(createFlattenedLayer(this, Traits));
        }

        addStratum(id: string): Partial<T> {
            let result = this.strata.get(id);
            if (!result) {
                result = this.createTraitsInstance();
                this.strata.set(id, result);
            }
            return result;
        }

        @computed
        get strataTopToBottom() {
            return StratumOrder.sortTopToBottom(this.strata);
        }

        @computed
        get strataBottomToTop() {
            return StratumOrder.sortBottomToTop(this.strata);
        }

        createTraitsInstance(): Partial<T> {
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

        const flattened: any = {};

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

    // This is almost like Partial<T>, except it uses `| undefined` instead of
    // `[P in keyof T]?`, which is subtly different. The former requires that the
    // property exist but its value may be undefined, while the latter does
    // not require that the property exist at all.
    type OrUndefined<T> = {
        [P in keyof T]: T[P] | undefined;
    }

    export type InterfaceFromTraits<TDefinition extends ModelTraits> = OrUndefined<MakeReadonly<TDefinition>>;
}

export default Model;
