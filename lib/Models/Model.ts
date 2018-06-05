import { ObservableMap, computed, decorate, observable } from 'mobx';
import Constructor from '../Core/Constructor';
import ModelDefinition from '../Definitions/ModelDefinition';
import { ModelProperty } from './ModelProperties';
import StratumOrder from './StratumOrder';
import Terria from './TerriaNew';
import * as DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';
import { ModelId } from '../Definitions/ModelReference';

interface MakeModelConcrete {
    readonly type;
    readonly strataTopToBottom: Partial<ModelDefinition>;
    readonly strataBottomToTop: Partial<ModelDefinition>;
}

interface DefinitionClass<T> {
    prototype: T;
    metadata: {
        [id: string]: ModelProperty;
    };
}

export interface BaseModel extends Model.InterfaceFromDefinition<ModelDefinition> {}

export abstract class BaseModel {
    constructor(readonly id: ModelId, readonly terria: Terria) {
    }

    readonly strata = observable.map<string, Partial<ModelDefinition>>();

    abstract get strataTopToBottom(): Partial<ModelDefinition>[];
    abstract get strataBottomToTop(): Partial<ModelDefinition>[];

    static definition<T extends ModelDefinition>(definition: DefinitionClass<T>): Function {
        return function <T extends BaseModel>(target: Constructor<T & MakeModelConcrete>) {
            class UpdatedModel extends (target as Constructor<BaseModel & MakeModelConcrete>) {
                readonly flattened: ModelDefinition;

                constructor(...args: any[]) {
                    super(...args);
                    this.flattened = observable(createFlattenedLayer(this, definition));
                }

                createDefinitionInstance: () => Partial<ModelDefinition> = () => {
                    const metadata = definition.metadata;
                    const propertyNames = Object.keys(metadata);
                    const reduced: any = propertyNames.reduce((p, c) => ({ ...p, [c]: undefined }), {});
                    return observable(reduced);
                }
            }

            const decorators: any = {};

            // Add top-level accessors that don't already exist.
            const metadata = definition.metadata;
            Object.keys(metadata).forEach(propertyName => {
                const property = metadata[propertyName];

                if (!(propertyName in UpdatedModel.prototype)) {
                    Object.defineProperty(UpdatedModel.prototype, propertyName, {
                        get: function() {
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

function createFlattenedLayer(model, definition) {
    const metadata = definition.metadata;

    const flattened: any = {};

    Object.keys(metadata).forEach(propertyName => {
        const property = metadata[propertyName];

        Object.defineProperty(flattened, propertyName, {
            get: function() {
                return property.getValue(model);
            },
            enumerable: true
        });
    });

    return flattened;
}

class Model<T extends ModelDefinition> extends BaseModel {
    readonly flattened: Model.MakeReadonly<T>;
    readonly strata: ObservableMap<string, Partial<T>>;
    readonly createDefinitionInstance: () => Partial<T> = function() {
        // This implementation will be replaced by the `definition` decorator.
        throw new DeveloperError('Definition instances cannot be created until the model\'s constructor finishes executing.');
    };

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
    export type MakeReadonly<TDefinition extends ModelDefinition> = {
        readonly [P in keyof TDefinition]: TDefinition[P] extends Array<infer TElement> ? ReadonlyArray<TElement> : TDefinition[P];
    };

    export type InterfaceFromDefinition<TDefinition extends ModelDefinition> = MakeReadonly<TDefinition>;
}

export default Model;
