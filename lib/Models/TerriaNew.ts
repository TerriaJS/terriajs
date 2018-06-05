import Class from '../Core/Class';
import instanceOf from '../Core/instanceOf';
import ModelReference from '../Definitions/ModelReference';
import Model, { BaseModel } from './Model';
import * as RuntimeError from 'terriajs-cesium/Source/Core/RuntimeError';

export default class Terria {
    private models = new Map<string, BaseModel>();

    getModelById<T extends BaseModel>(type: Class<T>, id: ModelReference): T {
        if (ModelReference.isRemoved(id)) {
            return undefined;
        } else {
            const model = this.models.get(id);
            if (instanceOf(type, model)) {
                return model;
            }

            // Model does not have the requested type.
            return undefined;
        }
    }

    addModel(model: BaseModel) {
        if (ModelReference.isRemoved(model.id)) {
            return;
        }

        if (this.models.has(model.id)) {
            throw new RuntimeError('A model with the specified ID already exists.')
        }

        this.models.set(model.id, model);
    }
}
