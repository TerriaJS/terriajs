import primitiveTrait from './primitiveTrait';
import Trait from './Trait';

class ModelDefinition {
    static metadata: {
        [id: string]: Trait;
    }

    // @primitiveTrait({
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
