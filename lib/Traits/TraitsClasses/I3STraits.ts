import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export default class I3STraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Terrain URL",
    description:
      "URL to construct ArcGISTiledElevationTerrainProvider for I3S geometry."
  })
  terrainURL?: string;

  @primitiveArrayTrait({
    type: "number",
    name: "Image based lighting factor",
    description: "Cartesian2 of lighting factor for imageBasedLightingFactor"
  })
  lightingFactor?: [number, number];
}
