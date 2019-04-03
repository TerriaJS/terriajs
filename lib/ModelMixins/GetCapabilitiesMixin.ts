import { computed } from 'mobx';
import Constructor from '../Core/Constructor';
import Model from '../Models/Model';
import StratumOrder from '../Models/StratumOrder';
import GetCapabilitiesTraits from '../Traits/GetCapabilitiesTraits';

function GetCapabilitiesMixin<T extends Constructor<Model<GetCapabilitiesTraits>>>(Base: T) {
    abstract class GetCapabilitiesMixin extends Base {
        protected abstract get defaultGetCapabilitiesUrl(): string | undefined;

        @computed
        get getCapabilitiesUrl(): string | undefined {
            const getCapabilitiesUrl = this.flattened.getCapabilitiesUrl;
            if (getCapabilitiesUrl) {
                return getCapabilitiesUrl;
            } else {
                return this.defaultGetCapabilitiesUrl;
            }
        }
    }
    return GetCapabilitiesMixin;
}

namespace GetCapabilitiesMixin {
    export const getCapabilitiesStratumName = 'getCapabilities';
    StratumOrder.addLoadStratum(getCapabilitiesStratumName);
}

export default GetCapabilitiesMixin;
