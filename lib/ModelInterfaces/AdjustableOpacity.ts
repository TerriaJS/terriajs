import WithStrata from "./WithStrata";

export interface AdjustableOpacityTraits {
    opacity: number;
}

interface AdjustableOpacity extends WithStrata<AdjustableOpacityTraits> {
    readonly implementsAdjustableOpacity: true;
    readonly opacity: number;
}

namespace AdjustableOpacity {
    export function implementedBy(o: any): o is AdjustableOpacity {
        return o.implementsAdjustableOpacity;
    }
}

export default AdjustableOpacity;
