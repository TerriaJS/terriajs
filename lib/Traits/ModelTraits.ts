import primitiveTrait from './primitiveTrait';
import Trait from './Trait';

class ModelTraits {
    static traits: {
        [id: string]: Trait;
    }
}

namespace ModelTraits {
    export type Constructor = new(...args: any[]) => ModelTraits;
}

export default ModelTraits;
