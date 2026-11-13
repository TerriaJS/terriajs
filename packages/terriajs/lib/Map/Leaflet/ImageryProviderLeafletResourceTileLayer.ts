import L, { TileEvent } from "leaflet";
import RequestScheduler from "terriajs-cesium/Source/Core/RequestScheduler";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import Leaflet from "../../Models/Leaflet";
import { getResourceForImageryTile } from "../ImageryProvider/getUrlForImageryTile";
import ImageryProviderLeafletTileLayer from "./ImageryProviderLeafletTileLayer";

// RequestScheduler only drops finished requests from its active list in
// update(), which only the Cesium render loop calls. update() and
// Request#cancel() are private in terriajs-cesium 26.3.0.
const updateRequestScheduler = () => (RequestScheduler as any).update();

/**
 * Loads tiles through Cesium Resource, as the Cesium map does, instead of
 * setting the tile image's src, so that Resource request headers and overrides
 * apply in 2D as they do in 3D. Tiles are shown from blob URLs, which are kept
 * until the tile is removed so that screenshots can read them. Requires tile
 * servers to support CORS.
 */
export default class ImageryProviderLeafletResourceTileLayer extends ImageryProviderLeafletTileLayer {
  /** Cancels the pending Resource request of a tile */
  private _tileRequestCancellers = new WeakMap<HTMLElement, () => void>();
  private _tileBlobUrls = new WeakMap<HTMLElement, string>();

  constructor(
    leaflet: Leaflet,
    imageryProvider: ImageryProvider,
    options: L.TileLayerOptions = {}
  ) {
    super(leaflet, imageryProvider, options);

    const releaseTile = (event: TileEvent) => {
      this._tileRequestCancellers.get(event.tile)?.();
      this._tileRequestCancellers.delete(event.tile);
      this._revokeBlobUrl(event.tile);
    };
    this.on("tileabort", releaseTile);
    this.on("tileunload", releaseTile);
  }

  private _revokeBlobUrl(tile: HTMLElement) {
    const blobUrl = this._tileBlobUrls.get(tile);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      this._tileBlobUrls.delete(tile);
    }
  }

  _abortLoading() {
    // Leaflet only aborts tiles whose image is still loading. A tile waiting on
    // its Resource request has no src yet, so Leaflet sees it as complete.
    const tiles: Record<string, { el: HTMLElement; coords: L.Coords }> = (
      this as any
    )._tiles;
    for (const key in tiles) {
      const { el, coords } = tiles[key];
      if (
        coords.z !== (this as any)._tileZoom &&
        this._tileRequestCancellers.has(el)
      ) {
        L.DomUtil.remove(el);
        delete tiles[key];
        this.fire("tileabort", { tile: el, coords });
      }
    }
    (L.TileLayer as any).prototype._abortLoading.call(this);
  }

  createTile(coords: L.Coords, done: L.DoneCallback) {
    const tile = document.createElement("img");
    tile.alt = "";
    tile.setAttribute("role", "presentation");

    const showErrorTile = (e: unknown) =>
      (L.TileLayer as any).prototype._tileOnError.call(this, done, tile, e);
    const failTile = (e: unknown) => {
      this._revokeBlobUrl(tile);
      this._reportTileError(coords, e);
      showErrorTile(e);
    };

    L.DomEvent.on(tile, "load", () => (this as any)._tileOnLoad(done, tile));
    // Errors decoding the image, unless it is the error tile failing to load
    L.DomEvent.on(tile, "error", (e) => {
      if (tile.getAttribute("src") !== this.options.errorTileUrl) {
        failTile(e);
      }
    });

    const level = this._getLevelFromZ(coords);
    const resource =
      level >= 0
        ? getResourceForImageryTile(
            this.imageryProvider,
            coords.x,
            coords.y,
            level
          )
        : undefined;
    if (!resource) {
      showErrorTile(new Error("No resource for tile"));
      return tile;
    }
    if (resource.isDataUri || resource.isBlobUri) {
      tile.src = resource.url;
      return tile;
    }

    let aborted = false;
    const tileResource = resource.clone();
    this._tileRequestCancellers.set(tile, () => {
      aborted = true;
      // Lets RequestScheduler release the request's per-server slot and abort
      // its XHR, which would otherwise never settle
      (tileResource.request as any).cancel();
      updateRequestScheduler();
    });

    const blobPromise: Promise<Blob | undefined> =
      tileResource.fetchBlob() ??
      Promise.reject(new Error("Tile request was throttled"));

    blobPromise
      .finally(() => {
        this._tileRequestCancellers.delete(tile);
        updateRequestScheduler();
      })
      .then((blob) => {
        if (aborted) {
          return;
        }
        if (!blob) {
          failTile(new Error("Tile request returned no data"));
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        this._tileBlobUrls.set(tile, blobUrl);
        tile.src = blobUrl;
      })
      .catch((e) => {
        if (!aborted) {
          failTile(e);
        }
      });

    return tile;
  }
}
