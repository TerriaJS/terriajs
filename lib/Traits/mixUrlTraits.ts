import ModelTraits from './ModelTraits';
import primitiveTrait from './primitiveTrait';
import TraitsConstructor from './TraitsConstructor';

export default function mixUrlTraits<TBase extends TraitsConstructor<ModelTraits>>(Base: TBase) {
    class UrlTraits extends Base {
        @primitiveTrait({
            type: 'string',
            name: 'URL',
            description: 'The base URL of the file or service.'
        })
        url?: string;
    }
    return UrlTraits;
}
