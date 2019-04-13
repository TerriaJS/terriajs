import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class MappableTraits extends ModelTraits {
    @primitiveTrait({
        type: 'boolean',
        name: 'Show',
        description: 'Show or hide the mappable item'
    })
    show: boolean = true;
}
