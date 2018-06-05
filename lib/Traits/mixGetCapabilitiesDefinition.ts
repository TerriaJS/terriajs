import ModelDefinition from "./ModelDefinition";
import primitiveTrait from "./primitiveTrait";

export default function mixGetCapabilitiesDefinition<TBase extends ModelDefinition.Constructor>(Base: TBase) {
    class GetCapabilitiesDefinition extends Base {
        @primitiveTrait({
            type: 'string',
            name: 'GetCapabilities URL',
            description: 'The URL at which to access to the OGC GetCapabilities service.'
        })
        getCapabilitiesUrl: string;

        @primitiveTrait({
            type: 'string',
            name: 'GetCapabilities Cache Duration',
            description: 'The amount of time to cache GetCapabilities responses.',
            default: '1d'
        })
        getCapabilitiesCacheDuration: string;
    }
    return GetCapabilitiesDefinition;
}
