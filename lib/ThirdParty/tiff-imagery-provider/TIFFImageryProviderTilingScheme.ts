import CesiumMath from "terriajs-cesium/Source/Core/Math";

import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";

class TIFFImageryProviderTilingScheme extends WebMercatorTilingScheme {
  constructor(options?: {
    ellipsoid?: Ellipsoid;
    numberOfLevelZeroTilesX?: number;
    numberOfLevelZeroTilesY?: number;
    rectangleSouthwestInMeters?: Cartesian2;
    rectangleNortheastInMeters?: Cartesian2;
    project?: (pos: number[]) => number[];
    unproject?: (pos: number[]) => number[];
  }) {
    super(options);

    // @ts-ignore
    const { project, unproject } = options;
    if (project) {
      // @ts-ignore
      this._projection.project = function (cartographic: Cartographic) {
        const [x, y] = unproject(
          [cartographic.longitude, cartographic.latitude].map(
            CesiumMath.toDegrees
          )
        );
        const z = cartographic.height;
        return new Cartesian3(x, y, z);
      };
    }
    if (unproject) {
      // @ts-ignore
      this._projection.unproject = function (cartesian: Cartesian3) {
        const [longitude, latitude] = project([cartesian.x, cartesian.y]).map(
          CesiumMath.toRadians
        );
        const height = cartesian.z;
        return new Cartographic(longitude, latitude, height);
      };
    }

    const southwest = this.projection.unproject(
      options?.rectangleSouthwestInMeters as any
    );
    const northeast = this.projection.unproject(
      options?.rectangleNortheastInMeters as any
    );
    // @ts-ignore
    this._rectangle = new Rectangle(
      southwest.longitude,
      southwest.latitude,
      northeast.longitude,
      northeast.latitude
    );
  }
}

export default TIFFImageryProviderTilingScheme;
