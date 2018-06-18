import { ObservableMap, computed, decorate, observable } from 'mobx';
import * as DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';
import Constructor from '../Core/Constructor';
import Trait from '../Traits/Trait';
import ModelTraits from '../Traits/ModelTraits';
import { ModelId } from '../Traits/ModelReference';
import StratumOrder from './StratumOrder';
import Terria from './TerriaNew';

interface MakeModelConcrete {
    readonly type: string;
    readonly strataTopToBottom: Partial<ModelTraits>[];
    readonly strataBottomToTop: Partial<ModelTraits>[];
}

interface DefinitionClass<T> {
    prototype: T;
    traits: {
        [id: string]: Trait;
    };
}

export interface BaseModel extends Model.InterfaceFromDefinition<ModelTraits> {}

export abstract class BaseModel {
    constructor(readonly id: ModelId, readonly terria: Terria) {
    }

    readonly flattened: any;
    readonly strata = observable.map<string, Partial<ModelTraits>>();

    abstract get strataTopToBottom(): Partial<ModelTraits>[];
    abstract get strataBottomToTop(): Partial<ModelTraits>[];

    static definition<T extends ModelTraits>(definition: DefinitionClass<T>): Function {
        return function <T extends BaseModel>(target: Constructor<T & MakeModelConcrete>) {
            class UpdatedModel extends (target as Constructor<BaseModel & MakeModelConcrete>) {
                readonly flattened: any;

                constructor(...args: any[]) {
                    super(...args);
                    this.flattened = observable(createFlattenedLayer(this, definition));
                }

                createDefinitionInstance: () => Partial<ModelTraits> = () => {
                    const traits = definition.traits;
                    const propertyNames = Object.keys(traits);
                    const reduced: any = propertyNames.reduce((p, c) => ({ ...p, [c]: undefined }), {});
                    return observable(reduced);
                }
            }

            const decorators: any = {};

            // Add top-level accessors that don't already exist.
            const traits = definition.traits;
            Object.keys(traits).forEach(propertyName => {
                const property = traits[propertyName];

                if (!(propertyName in UpdatedModel.prototype)) {
                    Object.defineProperty(UpdatedModel.prototype, propertyName, {
                        get: function(this: UpdatedModel) {
                            return this.flattened[propertyName];
                        },
                        enumerable: true,
                        configurable: true
                    });

                    decorators[propertyName] = computed;
                }
            });

            decorate(UpdatedModel, decorators);

            return UpdatedModel;
        }
    }
}

function createFlattenedLayer<T>(model: BaseModel, definition: DefinitionClass<T>) {
    const traits = definition.traits;

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

interface Model<T extends ModelTraits> extends BaseModel {
    readonly flattened: Model.MakeReadonly<T>;
    readonly strata: ObservableMap<string, Partial<T>>;
}

class Model<T extends ModelTraits> extends BaseModel {
    readonly createDefinitionInstance: () => Partial<T> = function() {
        // This implementation will be replaced by the `definition` decorator.
        throw new DeveloperError('Definition instances cannot be created until the model\'s constructor finishes executing.');
    };

    constructor(readonly id: ModelId, readonly terria: Terria) {
        super(id, terria);
    }

    addStratum(id: string): Partial<T> {
        let result = this.strata.get(id);
        if (!result) {
            result = <Partial<T>>this.createDefinitionInstance();
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
}

namespace Model {
    export type MakeReadonly<TDefinition extends ModelTraits> = {
        readonly [P in keyof TDefinition]-?: (Exclude<TDefinition[P], undefined> extends Array<infer TElement> ?
            ReadonlyArray<Readonly<TElement>> :
            TDefinition[P] extends ModelTraits ?
                MakeReadonly<TDefinition[P]> :
                Readonly<TDefinition[P]>) | undefined | undefined;
    };

    // This is almost like Partial<T>, except it uses `| undefined` instead of
    // `[P in keyof T]?`, which is subtly different. The former requires that the
    // property exist but its value may be undefined, while the latter does
    // not require that the property exist at all.
    type OrUndefined<T> = {
        [P in keyof T]: T[P] | undefined;
    }

    export type InterfaceFromDefinition<TDefinition extends ModelTraits> = OrUndefined<MakeReadonly<TDefinition>>;
}

export default Model;
