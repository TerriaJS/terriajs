import L, { TileEvent } from "leaflet";
import { autorun, computed, IReactionDisposer, observable } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import Leaflet from "../Models/Leaflet";
import MapboxVectorTileImageryProvider from "./MapboxVectorTileImageryProvider";

export default class MapboxVectorCanvasTileLayer extends L.GridLayer {
  readonly errorEvent: CesiumEvent = new CesiumEvent();
  readonly initialized: boolean = false;
  readonly _usable: boolean = false;
  readonly _delayedUpdate: unknown = undefined;
  readonly _zSubtract: number = 0;
  readonly _previousCredits: unknown[] = [];

  @observable splitDirection = ImagerySplitDirection.NONE;
  @observable splitPosition: number = 0.5;

  constructor(
    private leaflet: Leaflet,
    readonly imageryProvider: MapboxVectorTileImageryProvider,
    options: L.GridLayerOptions
  ) {
    super(Object.assign(options, { async: true, tileSize: 256 }));

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

    // Hack to fix "Space between tiles on fractional zoom levels in Webkit browsers" (https://github.com/Leaflet/Leaflet/issues/3575#issuecomment-688644225)
    this.on("tileloadstart", (event: TileEvent) => {
      event.tile.style.width = this.getTileSize().x + 0.5 + "px";
      event.tile.style.height = this.getTileSize().y + 0.5 + "px";
    });
  }

  _reactToSplitterChange() {
    return autorun(() => {
      const container = this.getContainer();
      if (container === null) {
        return;
      }

      if (this.splitDirection === ImagerySplitDirection.LEFT) {
        const { left: clipLeft } = this._clipsForSplitter;
        container.style.clip = clipLeft;
      } else if (this.splitDirection === ImagerySplitDirection.RIGHT) {
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

  createTile(tilePoint: L.Coords, done: L.DoneCallback) {
    const canvas = <HTMLCanvasElement>(
      L.DomUtil.create("canvas", "leaflet-tile")
    );
    const size = this.getTileSize();
    canvas.width = size.x;
    canvas.height = size.y;

    this.imageryProvider.readyPromise
      .then(() => {
        const n = this.imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(
          tilePoint.z
        );
        return this.imageryProvider._requestImage(
          CesiumMath.mod(tilePoint.x, n),
          tilePoint.y,
          tilePoint.z,
          canvas
        );
      })
      .then(function(canvas) {
        done(undefined, canvas);
      });
    return canvas; // Not yet drawn on, but Leaflet requires the tile
  }

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
