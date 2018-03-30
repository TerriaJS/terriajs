import ModelProperty from './ModelProperty';
import * as defined from 'terriajs-cesium/Source/Core/defined';

export default class PrimitiveModelProperty extends ModelProperty {
    constructor(options) {
        super(options);
    }

    combineLayerValues(below, above) {
        return defined(above) ? above : below;
    }
}
