import Model, { BaseModel } from './Model';

export interface ImageryLayer {
    // TODO
    alpha: number;
    wms: boolean;
    isGeoServer: boolean;
    show: boolean;
}

export interface DataSource {
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
