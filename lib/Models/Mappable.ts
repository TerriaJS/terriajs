import DataSource from 'terriajs-cesium/Source/DataSources/DataSource';
import 'terriajs-cesium/Source/Scene/ImageryProvider';
import { BaseModel } from './Model';

// Shouldn't this be a class?
export interface ImageryParts {
    // TODO
    alpha: number;
    // wms: boolean;
    // isGeoServer: boolean;
    show: boolean;
    imageryProvider: Cesium.ImageryProvider;
}

// This discriminator only discriminates between ImageryParts and DataSource
export namespace ImageryParts {
    export function is(object: ImageryParts | DataSource): object is ImageryParts {
        return 'imageryProvider' in object;
    }
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
