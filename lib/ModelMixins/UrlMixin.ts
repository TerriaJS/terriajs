import { computed } from 'mobx';
import * as URI from 'urijs';
import Constructor from '../Core/Constructor';

interface RequiredOnInstance {
    url: string | undefined;
}

export default function UrlMixin<T extends Constructor<RequiredOnInstance>>(Base: T) {
    class UrlMixin extends Base {
        @computed
        get uri(): uri.URI | undefined {
            if (this.url === undefined) {
                return undefined;
            }
            return new URI(this.url);
        }
    }

    return UrlMixin;
}
