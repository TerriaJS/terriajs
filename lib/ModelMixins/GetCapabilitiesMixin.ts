import { computed } from 'mobx';
import Constructor from '../Core/Constructor';
import StratumOrder from '../Models/StratumOrder';

interface RequiredOnDefinition {
    getCapabilitiesUrl: string | undefined;
}

interface RequiredOnInstance {
    url: string | undefined;
    flattened: RequiredOnDefinition;
}

function GetCapabilitiesMixin<T extends Constructor<RequiredOnInstance>>(Base: T) {
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
