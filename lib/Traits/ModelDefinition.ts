import primitiveProperty from './primitiveProperty';
import DefinitionProperty from './Trait';

class ModelDefinition {
    static metadata: {
        [id: string]: DefinitionProperty;
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
