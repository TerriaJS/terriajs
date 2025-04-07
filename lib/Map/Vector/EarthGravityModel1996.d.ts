import Cartographic from "terriajs-cesium/Source/Core/Cartographic";

declare class EarthGravityModel1996 {
  readonly minimumHeight: number;
  readonly maximumHeight: number;

  constructor(gridFileUrl: string);

  getHeight(longitude: number, latitude: number): Promise<number>;

  getHeights(cartographicArray: Cartographic[]): Promise<Cartographic[]>;
}

export default EarthGravityModel1996;
