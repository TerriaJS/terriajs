import Constructor from "../Core/Constructor";
import StratumOrder from "../Models/StratumOrder";

interface RequiredOnInstance {
    url: string | undefined;
}

function LoadGeoJsonMixin<T extends Constructor<RequiredOnInstance>>(Base: T) {
    abstract class LoadGeoJsonMixin extends Base {
    }

    return LoadGeoJsonMixin;
}

namespace LoadGeoJsonMixin {
    export const loadGeoJsonStratumName = 'loadGeoJson';
    StratumOrder.addLoadStratum(loadGeoJsonStratumName);
}

export default LoadGeoJsonMixin;
