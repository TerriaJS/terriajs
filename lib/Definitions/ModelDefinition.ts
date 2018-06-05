import primitiveProperty from './primitiveProperty';
import { ModelProperty } from '../Models/ModelProperties';

class ModelDefinition {
    static metadata: {
        [id: string]: ModelProperty;
    }

    // @primitiveProperty({
    //     type: 'string',
    //     name: 'ID',
    //     description: 'The unique ID of this model'
    // })
    // id: string;
}

namespace ModelDefinition {
    export type Constructor = new(...args: any[]) => ModelDefinition;
}

export default ModelDefinition;
