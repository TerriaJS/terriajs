import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import objectTrait from "./objectTrait";

export class RectangleTraits extends ModelTraits {
    @primitiveTrait({
        type: 'number',
        name: 'West',
        description: 'The westernmost longitude in degrees.'
    })
    west?: number;

    @primitiveTrait({
        type: 'number',
        name: 'South',
        description: 'The southernmost longitude in degrees.'
    })
    south?: number;

    @primitiveTrait({
        type: 'number',
        name: 'East',
        description: 'The easternmost longitude in degrees.'
    })
    east?: number;

    @primitiveTrait({
        type: 'number',
        name: 'North',
        description: 'The northernmost longitude in degrees.'
    })
    north?: number;
}

export default class MappableTraits extends ModelTraits {
    @primitiveTrait({
        type: 'boolean',
        name: 'Show',
        description: 'Show or hide the mappable item'
    })
    show: boolean = true;

    @objectTrait({
        type: RectangleTraits,
        name: 'Rectangle',
        description: 'The bounding box rectangle that contains all the data in this catalog item.'
    })
    rectangle?: RectangleTraits;
}
