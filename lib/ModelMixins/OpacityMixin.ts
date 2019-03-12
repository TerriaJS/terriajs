import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import Constructor from '../Core/Constructor';
import AdjustableOpacity, { AdjustableOpacityTraits } from '../Interfaces/AdjustableOpacity';
import { ObservableMap } from 'mobx';
import WithStrata from '../Interfaces/WithStrata';

interface RequiredOnInstance {
    readonly opacity: number | undefined;
    getOrCreateStratum(id: string): Partial<AdjustableOpacityTraits>;
}

export default function OpacityMixin<T extends Constructor<RequiredOnInstance>>(Base: T) {
    class OpacityMixin extends Base {
        get implementsAdjustableOpacity(): true {
            return true;
        }

        get opacity(): number {
            return defaultValue(super.opacity, 0.8);
        }
    }

    return OpacityMixin;
}
