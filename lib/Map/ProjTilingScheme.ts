import L from "leaflet";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import MapProjection from "terriajs-cesium/Source/Core/MapProjection";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import TilingScheme from "terriajs-cesium/Source/Core/TilingScheme";

class LeafletMapProjection implements MapProjection {
  constructor(readonly crs: L.Proj.CRS, readonly ellipsoid: Ellipsoid) {}

  // project from cartographic lat, lng to CRS local
  project(cartographic: Cartographic, result?: Cartesian3): Cartesian3 {
    const latLng = L.latLng(
      CesiumMath.toDegrees(cartographic.latitude),
      CesiumMath.toDegrees(cartographic.longitude)
    );
    const crsPoint = this.crs.project(latLng);
    result ??= new Cartesian3();
    result.x = crsPoint.x;
    result.y = crsPoint.y;
    result.z = 0;
    return result;
  }

  // Project from CRS local to cartographic lat lng
  unproject(cartesian: Cartesian3, result?: Cartographic): Cartographic {
    const crsPoint = L.point(cartesian.x, cartesian.y);
    const latLng = this.crs.unproject(crsPoint);
    return Cartographic.fromDegrees(latLng.lng, latLng.lat, undefined, result);
  }
}

// Tiling scheme for custom leaflet projection
class ProjTilingScheme implements TilingScheme {
  readonly ellipsoid: Ellipsoid;
  readonly projection: MapProjection;
  readonly rectangle: Rectangle;

  //TODO: set from catalog item
  readonly tileSize = L.point(256, 256);

  readonly crs: L.Proj.CRS;

  constructor(options: { crs: L.Proj.CRS; ellipsoid?: Ellipsoid }) {
    this.ellipsoid = options.ellipsoid ?? Ellipsoid.WGS84;
    this.crs = options.crs;
    this.projection = new LeafletMapProjection(this.crs, this.ellipsoid);

    const bounds = this.crs.projection.bounds;
    const southWest = this.projection.unproject(
      new Cartesian3(bounds.min!.x, bounds.min!.y)
    );
    const northEast = this.projection.unproject(
      new Cartesian3(bounds.max!.x, bounds.max!.y)
    );

    this.rectangle = new Rectangle(
      southWest.longitude,
      southWest.latitude,
      northEast.longitude,
      northEast.latitude
    );
  }

  private getNumberOfTilesAtLevel(level: number): L.Point {
    const bounds = this.crs.getProjectedBounds(level);
    const tileRangeMin = bounds.min!.unscaleBy(this.tileSize);
    const tileRangeMax = bounds.max!.unscaleBy(this.tileSize);
    const tileCount = tileRangeMax.subtract(tileRangeMin);
    return tileCount;
  }

  getNumberOfXTilesAtLevel(level: number): number {
    return this.getNumberOfTilesAtLevel(level).x;
  }

  getNumberOfYTilesAtLevel(level: number): number {
    return this.getNumberOfTilesAtLevel(level).y;
  }

  /**
   * Convert rectangle extent in WGS84 to extent in native CRS
   */
  rectangleToNativeRectangle(
    rectangle: Rectangle,
    result?: Rectangle | undefined
  ): Rectangle {
    const projection = this.projection;
    const southwest = projection.project(Rectangle.southwest(rectangle));
    const northeast = projection.project(Rectangle.northeast(rectangle));

    result ??= new Rectangle();
    result.west = southwest.x;
    result.south = southwest.y;
    result.east = northeast.x;
    result.north = northeast.y;
    return result;
  }

  /**
   * Converts tile coordinates to rectangle extent in WGS84
   */
  tileXYToRectangle(
    x: number,
    y: number,
    level: number,
    result?: any
  ): Rectangle {
    const nativeRectangle = this.tileXYToNativeRectangle(x, y, level, result);

    const projection = this.projection;
    const southwest = projection.unproject(
      new Cartesian3(nativeRectangle.west, nativeRectangle.south)
    );
    const northeast = projection.unproject(
      new Cartesian3(nativeRectangle.east, nativeRectangle.north)
    );

    nativeRectangle.west = southwest.longitude;
    nativeRectangle.south = southwest.latitude;
    nativeRectangle.east = northeast.longitude;
    nativeRectangle.north = northeast.latitude;
    return nativeRectangle;
  }

  /**
   * Converts tile coordinates to rectangle extent in native CRS
   */
  tileXYToNativeRectangle(
    x: number,
    y: number,
    level: number,
    result?: Rectangle
  ) {
    // Calculate pixel coordinates from tile coordinates
    const nwPixelPoint = L.point(x, y).scaleBy(this.tileSize);
    const sePixelPoint = nwPixelPoint.add(this.tileSize);

    const crs = this.crs;

    // Compute lat lng for pixel coordinates
    const nwLatLng = crs.pointToLatLng(nwPixelPoint, level);
    const seLatLng = crs.pointToLatLng(sePixelPoint, level);

    // Convert lat lng to coordinates in CRS
    const nwCrsPoint = crs.project(nwLatLng);
    const seCrsPoint = crs.project(seLatLng);
    const bounds = L.bounds(nwCrsPoint, seCrsPoint);

    // Compute bounds
    const rectangle = result ?? new Rectangle();
    const min = bounds.getTopLeft();
    const max = bounds.getBottomRight();
    rectangle.west = round8(min.x);
    rectangle.south = round8(min.y);
    rectangle.east = round8(max.x);
    rectangle.north = round8(max.y);

    return rectangle;
  }

  positionToTileXY(
    position: Cartographic,
    level: number,
    result: Cartesian2
  ): Cartesian2 {
    const latLng = L.latLng(
      CesiumMath.toDegrees(position.latitude),
      CesiumMath.toDegrees(position.longitude)
    );
    // Convert to coordinate in native CRS
    const crsCoord = this.crs.latLngToPoint(latLng, level);
    result ??= new Cartesian2();
    result.x = Math.floor(crsCoord.x / this.tileSize.x);
    result.y = Math.floor(crsCoord.y / this.tileSize.y);
    return result;
  }
}

function round8(value: number): number {
  return Math.round(value * 100000000) / 100000000;
}

// class ProjTilingScheme extends WebMercatorTilingScheme {
//   readonly nativeRectangle: Rectangle;

//   constructor(options: {
//     ellipsoid?: Ellipsoid;
//     numberOfLevelZeroTilesX?: number;
//     numberOfLevelZeroTilesY?: number;
//     rectangleSouthwestInMeters: Cartesian2;
//     rectangleNortheastInMeters: Cartesian2;
//     /** projection function, convert [lon, lat] position to [x, y] */
//     project: (pos: number[]) => number[];
//     /** unprojection function, convert [x, y] position to [lon, lat] */
//     unproject: (pos: number[]) => number[];
//   }) {
//     super(options);

//     const { project, unproject } = options;

//     this.nativeRectangle = new Rectangle(
//       options.rectangleSouthwestInMeters.x,
//       options.rectangleSouthwestInMeters.y,
//       options.rectangleNortheastInMeters.x,
//       options.rectangleNortheastInMeters.y
//     );

//     // @ts-ignore
//     this._projection = {
//       ellipsoid: this.ellipsoid,
//       project(cartographic: Cartographic, result?: Cartesian3): Cartesian3 {
//         const [x, y] = project(
//           [cartographic.longitude, cartographic.latitude].map(
//             CesiumMath.toDegrees
//           )
//         );
//         const z = cartographic.height;
//         return Cartesian3.fromElements(x, y, z, result);
//       },
//       unproject(cartesian: Cartesian3, result?: Cartographic): Cartographic {
//         const [longitude, latitude] = unproject([cartesian.x, cartesian.y]);
//         const height = cartesian.z;
//         return Cartographic.fromDegrees(longitude, latitude, height, result);
//       }
//     };

//     const swMeters = new Cartesian3();
//     options.rectangleSouthwestInMeters.clone(swMeters);
//     const neMeters = new Cartesian3();
//     options.rectangleNortheastInMeters.clone(neMeters);
//     const seMeters = new Cartesian3(neMeters.x, swMeters.y);
//     const nwMeters = new Cartesian3(swMeters.x, neMeters.y);

//     const southwest = this.projection.unproject(swMeters);
//     const southeast = this.projection.unproject(seMeters);
//     const northwest = this.projection.unproject(nwMeters);
//     const northeast = this.projection.unproject(neMeters);

//     // @ts-ignore
//     this._rectangle = Rectangle.fromCartographicArray([
//       southwest,
//       southeast,
//       northwest,
//       northeast
//     ]);
//   }

//   tileXYToNativeRectangle2(x: number, y: number, level: number) {
//     const rect = this.tileXYToRectangle(x, y, level);

//     const projection = this.projection;
//     const ws = projection.project(new Cartographic(rect.west, rect.south));
//     const wn = projection.project(new Cartographic(rect.west, rect.north));
//     const en = projection.project(new Cartographic(rect.east, rect.north));
//     const es = projection.project(new Cartographic(rect.east, rect.south));
//     const positions = [ws, wn, en, es];

//     const xx = positions.map((pos) => pos.x);
//     const yy = positions.map((pos) => pos.y);
//     return new Rectangle(
//       Math.min(...xx),
//       Math.min(...yy),
//       Math.max(...xx),
//       Math.max(...yy)
//     );
//   }

//   tileXYToRectangle(x: number, y: number, level: number) {
//     const rect = this.tileXYToNativeRectangle(x, y, level);

//     const projection = this.projection;
//     const ws = projection.unproject(new Cartesian3(rect.west, rect.south));
//     const wn = projection.unproject(new Cartesian3(rect.west, rect.north));
//     const en = projection.unproject(new Cartesian3(rect.east, rect.north));
//     const es = projection.unproject(new Cartesian3(rect.east, rect.south));
//     const newRect = Rectangle.fromCartographicArray([ws, wn, en, es]);
//     if (newRect.east < newRect.west) {
//       newRect.east += CesiumMath.TWO_PI;
//     }
//     return newRect;
//   }
// }

export default ProjTilingScheme;

// import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
// import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
// import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
// import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
// import CesiumMath from "terriajs-cesium/Source/Core/Math";
// import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
// import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
// import L from "leaflet";
// import TilingScheme from "terriajs-cesium/Source/Core/TilingScheme";
// import MapProjection from "terriajs-cesium/Source/Core/MapProjection";

// class LeafletMapProjection implements MapProjection {
//   constructor(readonly crs: L.Proj.CRS, readonly ellipsoid: Ellipsoid) {}

//   // project from cartographic lat, lng to CRS local
//   project(cartographic: Cartographic, result?: Cartesian3): Cartesian3 {
//     const latLng = L.latLng(
//       CesiumMath.toDegrees(cartographic.latitude),
//       CesiumMath.toDegrees(cartographic.longitude)
//     );
//     const crsPoint = this.crs.project(latLng);
//     result ??= new Cartesian3();
//     result.x = crsPoint.x;
//     result.y = crsPoint.y;
//     result.z = 0;
//     return result;
//   }

//   // Project from CRS local to cartographic lat lng
//   unproject(cartesian: Cartesian3, result?: Cartographic): Cartographic {
//     const crsPoint = L.point(cartesian.x, cartesian.y);
//     const latLng = this.crs.unproject(crsPoint);
//     return Cartographic.fromDegrees(latLng.lng, latLng.lat, undefined, result);
//   }
// }

// class ProjTilingScheme implements TilingScheme {
//   // _rectangleNortheastInMeters = new Cartesian2(3299207.53, 3333134.03);
//   // _rectangleSouthwestInMeters = new Cartesian2(0, 0);

//   // this._rectangleNortheastInMeters = new Cartesian2(3299207.53, 3333134.03);
//   // this._rectangleSouthwestInMeters = new Cartesian2(-3299207.53, -3333134.03);

//   // _rectangleSouthwestInMeters = new Cartesian2(
//   //   -3708391.4745933944,
//   //   -3708391.4745933944
//   // );
//   // _rectangleNortheastInMeters = new Cartesian2(
//   //   3708391.4745933944,
//   //   3708391.4745933944
//   // );

//   readonly ellipsoid: Ellipsoid;
//   readonly projection: MapProjection;
//   readonly rectangle: Rectangle;

//   constructor(options: { ellipsoid?: Ellipsoid }) {
//     this.ellipsoid = options.ellipsoid ?? Ellipsoid.WGS84;

//     const crs = window.viewState.terria.leaflet.map.options.crs;
//     this.projection = new LeafletMapProjection(crs, this.ellipsoid);

//     const bounds = crs.projection.bounds;
//     const southWest = this.projection.unproject(
//       new Cartesian3(bounds.min.x, bounds.min.y)
//     );
//     const northEast = this.projection.unproject(
//       new Cartesian3(bounds.max.x, bounds.max.y)
//     );

//     // const rectangleNortheastInMeters = new Cartesian3(3299207.53, 3333134.03);
//     // const rectangleSouthwestInMeters = new Cartesian3(-3299207.53, -3333134.03);
//     // const southWest = this.projection.unproject(rectangleSouthwestInMeters);
//     // const northEast = this.projection.unproject(rectangleNortheastInMeters);

//     this.rectangle = new Rectangle(
//       southWest.longitude,
//       southWest.latitude,
//       northEast.longitude,
//       northEast.latitude
//     );

//     console.log(
//       CesiumMath.toDegrees(southWest.longitude),
//       CesiumMath.toDegrees(southWest.latitude),
//       CesiumMath.toDegrees(northEast.longitude),
//       CesiumMath.toDegrees(northEast.latitude)
//     );

//     // const southwest = this.projection.unproject(
//     //   this._rectangleSouthwestInMeters
//     // );
//     // const northeast = this.projection.unproject(
//     //   this._rectangleNortheastInMeters
//     // );
//     // this._rectangle = new Rectangle(
//     //   southwest.longitude,
//     //   southwest.latitude,
//     //   northeast.longitude,
//     //   northeast.latitude
//     // );

//     // super({
//     //   ...options,
//     //   rectangleNortheastInMeters: new Cartesian2(3299207.53, 3333134.03),
//     //   rectangleSouthwestInMeters: new Cartesian2(-3299207.53, -3333134.03),
//     //   // rectangleNortheastInMeters: new Cartesian2(3299207.53, 3333134.03),
//     //   // rectangleSouthwestInMeters: new Cartesian2(0, 0),
//     //   numberOfLevelZeroTilesX: 4,
//     //   numberOfLevelZeroTilesY: 4
//     // });
//   }

//   getNumberOfXTilesAtLevel(level: number): number {
//     return 1 << level;
//   }

//   getNumberOfYTilesAtLevel(level: number): number {
//     return 1 << level;
//   }

//   rectangleToNativeRectangle(
//     rectangle: Rectangle,
//     result?: Rectangle | undefined
//   ): Rectangle {
//     const projection = this.projection;
//     const southwest = projection.project(Rectangle.southwest(rectangle));
//     const northeast = projection.project(Rectangle.northeast(rectangle));

//     result ??= new Rectangle();
//     result.west = southwest.x;
//     result.south = southwest.y;
//     result.east = northeast.x;
//     result.north = northeast.y;
//     return result;
//   }

//   tileXYToRectangle(
//     x: number,
//     y: number,
//     level: number,
//     result?: any
//   ): Rectangle {
//     const nativeRectangle = this.tileXYToNativeRectangle(x, y, level, result);

//     const projection = this.projection;
//     const southwest = projection.unproject(
//       new Cartesian3(nativeRectangle.west, nativeRectangle.south)
//     );
//     const northeast = projection.unproject(
//       new Cartesian3(nativeRectangle.east, nativeRectangle.north)
//     );

//     nativeRectangle.west = southwest.longitude;
//     nativeRectangle.south = southwest.latitude;
//     nativeRectangle.east = northeast.longitude;
//     nativeRectangle.north = northeast.latitude;
//     return nativeRectangle;
//   }

//   tileXYToNativeRectangle(
//     x: number,
//     y: number,
//     level: number,
//     result?: Rectangle
//   ) {
//     const map = window.viewState.terria.leaflet.map;
//     const tileSize = new Cartesian2(256, 256);
//     const nwPoint = Cartesian2.multiplyComponents(
//       new Cartesian2(x, y),
//       tileSize,
//       new Cartesian2()
//     );
//     const sePoint = Cartesian2.add(nwPoint, tileSize, new Cartesian2());
//     const nw = map.unproject(nwPoint, level);
//     const se = map.unproject(sePoint, level);

//     const crs = map.options.crs;
//     const bounds = L.bounds(crs.project(nw), crs.project(se));
//     console.log(bounds);

//     const rectangle = result ?? new Rectangle();
//     rectangle.west = bounds.min.x;
//     rectangle.south = bounds.min.y;
//     rectangle.east = bounds.max.x;
//     rectangle.north = bounds.max.y;
//     return rectangle;
//   }

//   positionToTileXY(position: Cartographic, level: number, result: Cartesian2) {
//     const map = window.viewState.terria.leaflet.map;
//     const point = L.latLng(
//       CesiumMath.toDegrees(position.latitude),
//       CesiumMath.toDegrees(position.longitude)
//     );
//     const crsCoord = map.project(point, level);
//     const tileSize = 256;
//     const x = Math.floor(crsCoord.x / tileSize);
//     const y = Math.floor(crsCoord.y / tileSize);
//     return new Cartesian2(x, y);
//   }

//   // tileXYToNativeRectangle(
//   //   x: number,
//   //   y: number,
//   //   level: number,
//   //   result?: Rectangle
//   // ) {
//   //   console.log(x, y, level);
//   //   const xTiles = this.getNumberOfXTilesAtLevel(level);
//   //   const yTiles = this.getNumberOfYTilesAtLevel(level);

//   //   const xTileWidth =
//   //     (this._rectangleNortheastInMeters.x -
//   //       this._rectangleSouthwestInMeters.x) /
//   //     xTiles;
//   //   const west = this._rectangleSouthwestInMeters.x + x * xTileWidth;
//   //   const east = this._rectangleSouthwestInMeters.x + (x + 1) * xTileWidth;

//   //   const yTileHeight =
//   //     (this._rectangleNortheastInMeters.y -
//   //       this._rectangleSouthwestInMeters.y) /
//   //     yTiles;
//   //   const north = this._rectangleNortheastInMeters.y - y * yTileHeight;
//   //   const south = this._rectangleNortheastInMeters.y - (y + 1) * yTileHeight;

//   //   if (result === undefined) {
//   //     return new Rectangle(west, south, east, north);
//   //   }

//   //   result.west = west;
//   //   result.south = south;
//   //   result.east = east;
//   //   result.north = north;
//   //   return result;

//   //   // const actual = super.tileXYToNativeRectangle(x, y, level, new Rectangle());
//   //   // const fake = result ?? new Rectangle();

//   //   // const westProjected = -4194304.000000019;
//   //   // const southProjected = 2097152.0000000447;
//   //   // const eastProjected = -2097152.0000000442;
//   //   // const northProjected = 4194304.000000019;

//   //   // fake.west = westProjected;
//   //   // fake.south = southProjected;
//   //   // fake.east = eastProjected;
//   //   // fake.north = northProjected;

//   //   // console.log([x, y, level], actual, fake);
//   //   // return fake;
//   // }
// }

// // class ProjTilingScheme extends WebMercatorTilingScheme {
// //   readonly nativeRectangle: Rectangle;

// //   constructor(options: {
// //     ellipsoid?: Ellipsoid;
// //     numberOfLevelZeroTilesX?: number;
// //     numberOfLevelZeroTilesY?: number;
// //     rectangleSouthwestInMeters: Cartesian2;
// //     rectangleNortheastInMeters: Cartesian2;
// //     /** projection function, convert [lon, lat] position to [x, y] */
// //     project: (pos: number[]) => number[];
// //     /** unprojection function, convert [x, y] position to [lon, lat] */
// //     unproject: (pos: number[]) => number[];
// //   }) {
// //     super(options);

// //     const { project, unproject } = options;

// //     this.nativeRectangle = new Rectangle(
// //       options.rectangleSouthwestInMeters.x,
// //       options.rectangleSouthwestInMeters.y,
// //       options.rectangleNortheastInMeters.x,
// //       options.rectangleNortheastInMeters.y
// //     );

// //     // @ts-ignore
// //     this._projection = {
// //       ellipsoid: this.ellipsoid,
// //       project(cartographic: Cartographic, result?: Cartesian3): Cartesian3 {
// //         const [x, y] = project(
// //           [cartographic.longitude, cartographic.latitude].map(
// //             CesiumMath.toDegrees
// //           )
// //         );
// //         const z = cartographic.height;
// //         return Cartesian3.fromElements(x, y, z, result);
// //       },
// //       unproject(cartesian: Cartesian3, result?: Cartographic): Cartographic {
// //         const [longitude, latitude] = unproject([cartesian.x, cartesian.y]);
// //         const height = cartesian.z;
// //         return Cartographic.fromDegrees(longitude, latitude, height, result);
// //       }
// //     };

// //     const swMeters = new Cartesian3();
// //     options.rectangleSouthwestInMeters.clone(swMeters);
// //     const neMeters = new Cartesian3();
// //     options.rectangleNortheastInMeters.clone(neMeters);
// //     const seMeters = new Cartesian3(neMeters.x, swMeters.y);
// //     const nwMeters = new Cartesian3(swMeters.x, neMeters.y);

// //     const southwest = this.projection.unproject(swMeters);
// //     const southeast = this.projection.unproject(seMeters);
// //     const northwest = this.projection.unproject(nwMeters);
// //     const northeast = this.projection.unproject(neMeters);

// //     // @ts-ignore
// //     this._rectangle = Rectangle.fromCartographicArray([
// //       southwest,
// //       southeast,
// //       northwest,
// //       northeast
// //     ]);
// //   }

// //   tileXYToNativeRectangle2(x: number, y: number, level: number) {
// //     const rect = this.tileXYToRectangle(x, y, level);

// //     const projection = this.projection;
// //     const ws = projection.project(new Cartographic(rect.west, rect.south));
// //     const wn = projection.project(new Cartographic(rect.west, rect.north));
// //     const en = projection.project(new Cartographic(rect.east, rect.north));
// //     const es = projection.project(new Cartographic(rect.east, rect.south));
// //     const positions = [ws, wn, en, es];

// //     const xx = positions.map((pos) => pos.x);
// //     const yy = positions.map((pos) => pos.y);
// //     return new Rectangle(
// //       Math.min(...xx),
// //       Math.min(...yy),
// //       Math.max(...xx),
// //       Math.max(...yy)
// //     );
// //   }

// //   tileXYToRectangle(x: number, y: number, level: number) {
// //     const rect = this.tileXYToNativeRectangle(x, y, level);

// //     const projection = this.projection;
// //     const ws = projection.unproject(new Cartesian3(rect.west, rect.south));
// //     const wn = projection.unproject(new Cartesian3(rect.west, rect.north));
// //     const en = projection.unproject(new Cartesian3(rect.east, rect.north));
// //     const es = projection.unproject(new Cartesian3(rect.east, rect.south));
// //     const newRect = Rectangle.fromCartographicArray([ws, wn, en, es]);
// //     if (newRect.east < newRect.west) {
// //       newRect.east += CesiumMath.TWO_PI;
// //     }
// //     return newRect;
// //   }
// // }

// export default ProjTilingScheme;
