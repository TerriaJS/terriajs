import primitiveTrait from "./primitiveTrait";
import mixTraits from "./mixTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import MappableTraits from "./MappableTraits";

export default class BingMapsCatalaogItemTraits extends mixTraits(
    RasterLayerTraits,
    MappableTraits
) {
    @primitiveTrait({
        type: "string",
        name: "Map style",
        description: "Type of Bing Maps imagery"
    })
    mapStyle?: string;

    @primitiveTrait({
        type: "string",
        name: "Key",
        description: "The Bing Maps key"
    })
    key?: string;
}
