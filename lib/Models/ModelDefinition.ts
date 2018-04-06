import { ModelProperty } from './ModelProperties';

export default abstract class ModelDefinition {
    static metadata: {
        [id: string]: ModelProperty;
    }
}
