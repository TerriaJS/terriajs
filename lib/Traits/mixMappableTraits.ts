import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";


export default function mixMappableTraits<TBase extends ModelTraits.Constructor>(Base: TBase) {
    class MappableTraits extends Base {
        @primitiveTrait({
            type: 'boolean',
            name: 'Show',
            description: 'Show or hide the mappable item',
            default: true
        })
        show?: boolean;
    }

    return MappableTraits;
}
