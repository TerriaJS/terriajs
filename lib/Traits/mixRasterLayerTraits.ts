import ModelTraits from './ModelTraits';
import primitiveTrait from './primitiveTrait';

export default function mixRasterLayerTraits<TBase extends ModelTraits.Constructor>(Base: TBase) {
    class RasterLayerTraits extends Base {
        @primitiveTrait({
            type: 'number',
            name: 'Opacity',
            description: 'The opacity of the map layers.'
        })
        opacity: number = 0.8;
    }
    return RasterLayerTraits;
}
