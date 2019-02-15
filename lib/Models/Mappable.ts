import Model, { BaseModel } from './Model';

export interface ImageryParts {
    // TODO
    alpha: number;
    wms: boolean;
    isGeoServer: boolean;
    show: boolean;
    imageryProvider: Cesium.ImageryProvider;
}

export namespace ImageryParts {
    export function is(object: any): object is ImageryParts {
        return 'isGeoServer' in object;
    }
}




export interface DataSource {
}

interface Mappable {
    readonly mapItems: ReadonlyArray<DataSource | ImageryParts>;
}

namespace Mappable {
    export function is(model: BaseModel | Mappable): model is Mappable {
        return 'mapItems' in model;
    }
}

export default Mappable;
