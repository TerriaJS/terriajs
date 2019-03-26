import ModelTraits from './ModelTraits';
import primitiveTrait from './primitiveTrait';
import TraitsConstructor from './TraitsConstructor';

export default function mixRasterLayerTraits<TBase extends TraitsConstructor<ModelTraits>>(Base: TBase) {
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
