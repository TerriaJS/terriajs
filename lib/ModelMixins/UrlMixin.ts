import { computed } from 'mobx';
import URI from 'urijs';
import Constructor from '../Core/Constructor';
import Model from '../Models/Model';
import UrlTraits from '../Traits/UrlTraits';

type UrlModel = Model<UrlTraits>;

export default function UrlMixin<T extends Constructor<UrlModel>>(Base: T) {
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
