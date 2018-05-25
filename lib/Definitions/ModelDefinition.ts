import primitiveProperty from './primitiveProperty';
import { ModelProperty } from '../Models/ModelProperties';

class ModelDefinition {
    static metadata: ModelProperty[];

    @primitiveProperty({
        type: 'string',
        name: 'ID',
        description: 'The unique ID of this model'
    })
    id: string;
}

export default ModelDefinition;
