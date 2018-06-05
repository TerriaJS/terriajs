import ModelTraits from './ModelTraits';
import primitiveTrait from './primitiveTrait';

export default function mixUrlTraits<TBase extends ModelTraits.Constructor>(Base: TBase) {
    class UrlTraits extends Base {
        @primitiveTrait({
            type: 'string',
            name: 'URL',
            description: 'The base URL of the file or service.'
        })
        url: string;
    }
    return UrlTraits;
}
