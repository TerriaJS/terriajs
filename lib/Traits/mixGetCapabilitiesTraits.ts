import ModelTraits from './ModelTraits';
import primitiveTrait from './primitiveTrait';
import TraitsConstructor from './TraitsConstructor';

export default function mixGetCapabilitiesTraits<TBase extends TraitsConstructor<ModelTraits>>(Base: TBase) {
    class GetCapabilitiesTraits extends Base {
        @primitiveTrait({
            type: 'string',
            name: 'GetCapabilities URL',
            description: 'The URL at which to access to the OGC GetCapabilities service.'
        })
        getCapabilitiesUrl?: string;

        @primitiveTrait({
            type: 'string',
            name: 'GetCapabilities Cache Duration',
            description: 'The amount of time to cache GetCapabilities responses.'
        })
        getCapabilitiesCacheDuration: string = '1d';
    }
    return GetCapabilitiesTraits;
}
