import ModelProperty from './ModelProperty';
import * as defined from 'terriajs-cesium/Source/Core/defined';
import InfoModelDefinition from './InfoModelDefinition';

export default class InfoModelProperty extends ModelProperty {
    readonly type: any = InfoModelDefinition;

    combineLayerValues(below, above) {
        // TODO: de-duplicate sections
        if (defined(below) && defined(above)) {
            return below.concat(above);
        } else if (defined(above)) {
            return above;
        } else {
            return below;
        }
    }
}
