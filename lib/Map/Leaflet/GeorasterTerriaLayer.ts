import L from "leaflet";
import { autorun, computed, IReactionDisposer, observable } from "mobx";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import Leaflet from "../../Models/Leaflet";
import GeoRasterLayer, {
  GeoRaster,
  GeoRasterLayerOptions
} from "georaster-layer-for-leaflet";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";

// TODO: Cannot extend GeoRasterLayerOptions why?
// interface GeoRasterTerriaLayerOptions extends GeoRasterLayerOptions {
//   imageryProvider: ImageryProvider;
// }

//@ts-ignore
export default class GeorasterTerriaLayer extends GeoRasterLayer {
  readonly errorEvent: CesiumEvent = new CesiumEvent();
  readonly initialized: boolean = false;
  readonly _usable: boolean = false;
  readonly _delayedUpdate: unknown = undefined;
  readonly _zSubtract: number = 0;
  readonly _previousCredits: unknown[] = [];

  @observable splitDirection = SplitDirection.NONE;
  @observable splitPosition: number = 0.5;

  constructor(
    // private leaflet: Leaflet,
    options: GeoRasterLayerOptions,
    imageryProvider: ImageryProvider
  ) {
    super(Object.assign(options, { async: true, tileSize: 256 }));
    this.imageryProvider = imageryProvider; // TODO: add to Options instead?

    // Handle splitter rection (and disposing reaction)
    let disposeSplitterReaction: IReactionDisposer | undefined;
    this.on("add", () => {
      if (!disposeSplitterReaction) {
        disposeSplitterReaction = this._reactToSplitterChange();
      }
    });
    this.on("remove", () => {
      if (disposeSplitterReaction) {
        disposeSplitterReaction();
        disposeSplitterReaction = undefined;
      }
    });
  }

  _reactToSplitterChange() {
    return autorun(() => {
      const container = this.getContainer();
      if (container === null) {
        return;
      }

      if (this.splitDirection === SplitDirection.LEFT) {
        const { left: clipLeft } = this._clipsForSplitter;
        container.style.clip = clipLeft;
      } else if (this.splitDirection === SplitDirection.RIGHT) {
        const { right: clipRight } = this._clipsForSplitter;
        container.style.clip = clipRight;
      } else {
        container.style.clip = "auto";
      }
    });
  }

  @computed
  get _clipsForSplitter() {
    let clipLeft = "";
    let clipRight = "";
    let clipPositionWithinMap;
    let clipX;

    if (this.leaflet.size && this.leaflet.nw && this.leaflet.se) {
      clipPositionWithinMap = this.leaflet.size.x * this.splitPosition;
      clipX = Math.round(this.leaflet.nw.x + clipPositionWithinMap);
      clipLeft =
        "rect(" +
        [this.leaflet.nw.y, clipX, this.leaflet.se.y, this.leaflet.nw.x].join(
          "px,"
        ) +
        "px)";
      clipRight =
        "rect(" +
        [this.leaflet.nw.y, this.leaflet.se.x, this.leaflet.se.y, clipX].join(
          "px,"
        ) +
        "px)";
    }

    return {
      left: clipLeft,
      right: clipRight,
      clipPositionWithinMap: clipPositionWithinMap,
      clipX: clipX
    };
  }

  // createTile(tilePoint: L.Coords, done: L.DoneCallback) {
  //   const canvas = <HTMLCanvasElement>(
  //     L.DomUtil.create("canvas", "leaflet-tile")
  //   );
  //   const size = this.getTileSize();
  //   canvas.width = size.x;
  //   canvas.height = size.y;

  //   this.imageryProvider.readyPromise
  //     .then(() => {
  //       const n = this.imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(
  //         tilePoint.z
  //       );
  //       return this.imageryProvider.requestImageForCanvas(
  //         CesiumMath.mod(tilePoint.x, n),
  //         tilePoint.y,
  //         tilePoint.z,
  //         canvas
  //       );
  //     })
  //     .then(function (canvas) {
  //       done(undefined, canvas);
  //     });
  //   return canvas; // Not yet drawn on, but Leaflet requires the tile
  // }

  /** Currently uses the Cesium Imagery Provider to get the raster values.
   * TODO: Need to consider the efficiency fo this versus operating on the raster values loaded in GeoRasterLayer...
   * TODO: Need to weight up keeping most logic in Cesium side for code efficiency, versus duplicating the logic for more data efficiency.
   *
   * Another concern is - do we want the real raw raster value, or the display/render value?
   * This is discussed in https://github.com/GeoTIFF/georaster-layer-for-leaflet/issues/104
   * */
  getFeaturePickingCoords(
    map: L.Map,
    longitudeRadians: number,
    latitudeRadians: number
  ) {
    const ll = new Cartographic(
      CesiumMath.negativePiToPi(longitudeRadians),
      latitudeRadians,
      0.0
    );
    const level = Math.round(map.getZoom());

    return this.imageryProvider.readyPromise.then(() => {
      const tilingScheme = this.imageryProvider.tilingScheme;
      const coords = tilingScheme.positionToTileXY(ll, level);
      return {
        x: coords.x,
        y: coords.y,
        level: level
      };
    });
  }

  pickFeatures(
    x: number,
    y: number,
    level: number,
    longitudeRadians: number,
    latitudeRadians: number
  ) {
    // TODO: Is this code ever reached?
    // TODO: We COULD use the Cesium imaery provider to do the feature picking...
    // Otherwise if its easy with Georaster layer for leaflet, could do that...
    debugger;
    return this.imageryProvider.readyPromise.then(() => {
      return this.imageryProvider.pickFeatures(
        x,
        y,
        level,
        longitudeRadians,
        latitudeRadians
      );
    });
  }
}
