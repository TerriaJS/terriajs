import { ModelConstructor, BaseModel } from "./Model";
import Terria from "./TerriaNew";

// TODO: ideally this would be Promise-based so that we can defer loading Model classes until they're needed.

export default class ModelFactory {
    private constructors = new Map<string, ModelConstructor<BaseModel>>();

    register(type: string, constructor: ModelConstructor<BaseModel>) {
        this.constructors.set(type, constructor);
    }

    create(type: string, id: string, terria: Terria): BaseModel | undefined {
        const Constructor = this.constructors.get(type);
        if (Constructor === undefined) {
            return undefined;
        }
        return new Constructor(id, terria);
    }
}
