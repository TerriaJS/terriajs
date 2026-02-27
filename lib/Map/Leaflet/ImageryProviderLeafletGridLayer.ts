import L from "leaflet";
import { autorun, IReactionDisposer, observable, makeObservable } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import Leaflet from "../../Models/Leaflet";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import getClipsForSplitter from "./getClipsForSplitter";

export interface ImageryProviderWithGridLayerSupport extends ImageryProvider {
  requestImageForCanvas: (
    x: number,
    y: number,
    level: number,
    canvas: HTMLCanvasElement
  ) => Promise<HTMLCanvasElement>;
}

export const isImageryProviderGridLayer = (
  obj: any
): obj is ImageryProviderWithGridLayerSupport => {
  return typeof obj.requestImageForCanvas === "function";
};

export default class ImageryProviderLeafletGridLayer extends L.GridLayer {
  readonly errorEvent: CesiumEvent = new CesiumEvent();
  readonly initialized: boolean = false;
  readonly _usable: boolean = false;
  readonly _delayedUpdate: unknown = undefined;
  readonly _zSubtract: number = 0;
  readonly _previousCredits: unknown[] = [];

  @observable splitDirection = SplitDirection.NONE;
  @observable splitPosition: number = 0.5;

  constructor(
    private leaflet: Leaflet,
    readonly imageryProvider: ImageryProviderWithGridLayerSupport,
    options: L.GridLayerOptions
  ) {
    super(Object.assign(options, { async: true, tileSize: 256 }));

    makeObservable(this);

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

      if (
        this.splitDirection === SplitDirection.NONE ||
        !this.leaflet.size ||
        !this.leaflet.nw ||
        !this.leaflet.se
      ) {
        container.style.clipPath = "none";
        return;
      }

      const clips = getClipsForSplitter({
        size: this.leaflet.size,
        nw: this.leaflet.nw,
        se: this.leaflet.se,
        splitPosition: this.splitPosition
      });

      if (this.splitDirection === SplitDirection.LEFT) {
        container.style.clipPath = clips.left;
      } else {
        container.style.clipPath = clips.right;
      }
    });
  }

  createTile(tilePoint: L.Coords, done: L.DoneCallback) {
    const canvas = L.DomUtil.create(
      "canvas",
      "leaflet-tile"
    ) as HTMLCanvasElement;
    const size = this.getTileSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const n = this.imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(
      tilePoint.z
    );
    this.imageryProvider
      .requestImageForCanvas(
        CesiumMath.mod(tilePoint.x, n),
        tilePoint.y,
        tilePoint.z,
        canvas
      )
      .then(function (canvas) {
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

    const tilingScheme = this.imageryProvider.tilingScheme;
    const coords = tilingScheme.positionToTileXY(ll, level);
    return {
      x: coords.x,
      y: coords.y,
      level: level
    };
  }

  pickFeatures(
    x: number,
    y: number,
    level: number,
    longitudeRadians: number,
    latitudeRadians: number
  ) {
    return this.imageryProvider.pickFeatures(
      x,
      y,
      level,
      longitudeRadians,
      latitudeRadians
    );
  }
}
