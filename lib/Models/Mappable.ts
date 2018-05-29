import Model, { BaseModel } from './Model';

export class ImageryLayer {
}

export class DataSource {
}

interface Mappable {
    readonly mapItems: ReadonlyArray<DataSource | ImageryLayer>;
}

namespace Mappable {
    export function is(model: BaseModel | Mappable): model is Mappable {
        return 'mapItems' in model;
    }
}

export default Mappable;
