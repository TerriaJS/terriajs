import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import Constructor from '../Core/Constructor';
import AdjustableOpacity, { AdjustableOpacityTraits } from '../ModelInterfaces/AdjustableOpacity';
import WithStrata from '../ModelInterfaces/WithStrata';

interface RequiredOnInstance extends WithStrata<AdjustableOpacityTraits> {
    readonly opacity: number | undefined;
}

export default function OpacityMixin<T extends Constructor<RequiredOnInstance>>(Base: T): T & Constructor<AdjustableOpacity> {
    class OpacityMixin extends Base implements AdjustableOpacity {
        get implementsAdjustableOpacity(): true {
            return true;
        }

        get opacity(): number {
            return defaultValue(super.opacity, 0.8);
        }
    }

    return OpacityMixin;
}
