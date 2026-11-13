import L from "leaflet";
import { http, HttpResponse } from "msw";
import RequestScheduler from "terriajs-cesium/Source/Core/RequestScheduler";
import Resource from "terriajs-cesium/Source/Core/Resource";
import TileProviderError from "terriajs-cesium/Source/Core/TileProviderError";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import ImageryProviderLeafletResourceTileLayer from "../../../lib/Map/Leaflet/ImageryProviderLeafletResourceTileLayer";
import Leaflet from "../../../lib/Models/Leaflet";
import { worker } from "../../mocks/browser";

// RequestScheduler internals aren't part of Cesium's type definitions
const scheduler = RequestScheduler as any;

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const PNG = Uint8Array.from(atob(PNG_BASE64), (c) => c.charCodeAt(0));

const ERROR_TILE_URL = `data:image/png;base64,${PNG_BASE64}`;

const pngResponse = () =>
  new HttpResponse(PNG, { headers: { "Content-Type": "image/png" } });
describe("ImageryProviderLeafletResourceTileLayer", function () {
  const coords = Object.assign(L.point(1, 2), { z: 3 }) as L.Coords;
  let imageryProvider: UrlTemplateImageryProvider;
  let layer: ImageryProviderLeafletResourceTileLayer;

  beforeEach(function () {
    imageryProvider = new UrlTemplateImageryProvider({
      url: new Resource({
        url: "https://tiles.example.com/{z}/{x}/{y}.png",
        headers: { Authorization: "Bearer test-token" }
      })
    });
    layer = new ImageryProviderLeafletResourceTileLayer(
      {} as Leaflet,
      imageryProvider,
      { errorTileUrl: ERROR_TILE_URL }
    );
  });

  afterEach(function () {
    scheduler.clearForSpecs();
  });

  function loadTile() {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const tile = layer.createTile(coords, (error) =>
        error ? reject(error) : resolve(tile as HTMLImageElement)
      );
    });
  }

  function holdResponses() {
    let requestReceived!: () => void;
    const received = new Promise<void>((resolve) => {
      requestReceived = resolve;
    });
    let releaseResponse!: () => void;
    const released = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    worker.use(
      http.get("https://tiles.example.com/*", async () => {
        requestReceived();
        await released;
        return pngResponse();
      })
    );
    return { received, releaseResponse };
  }

  /** Add a tile to the layer as Leaflet does, then zoom away from it */
  function abortOnZoomChange(tile: HTMLElement) {
    const internals = layer as any;
    internals._tiles = {
      "1:2:3": { el: tile, coords, current: true }
    };
    internals._tileZoom = coords.z + 1;
    internals._abortLoading();
  }

  it("loads the tile through Resource with the imagery provider's headers", async function () {
    let authorization = null as string | null;
    worker.use(
      http.get("https://tiles.example.com/3/1/2.png", ({ request }) => {
        authorization = request.headers.get("Authorization");
        return pngResponse();
      })
    );

    const tile = await loadTile();

    expect(authorization).toBe("Bearer test-token");
    expect(tile.src).toMatch(/^blob:/);
  });

  it("keeps the blob URL of a loaded tile readable", async function () {
    worker.use(http.get("https://tiles.example.com/*", pngResponse));
    spyOn(URL, "revokeObjectURL").and.callThrough();

    const tile = await loadTile();
    const response = await fetch(tile.src);

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(response.ok).toBe(true);
  });

  it("revokes the blob URL when the tile is unloaded", async function () {
    worker.use(http.get("https://tiles.example.com/*", pngResponse));
    spyOn(URL, "revokeObjectURL").and.callThrough();

    const tile = await loadTile();
    layer.fire("tileunload", { tile, coords });

    expect(URL.revokeObjectURL).toHaveBeenCalledOnceWith(tile.src);
  });

  it("revokes the blob URL when the tile is aborted", async function () {
    worker.use(http.get("https://tiles.example.com/*", pngResponse));
    spyOn(URL, "revokeObjectURL").and.callThrough();

    const tile = await loadTile();
    layer.fire("tileabort", { tile, coords });

    expect(URL.revokeObjectURL).toHaveBeenCalledOnceWith(tile.src);
  });

  it("updates RequestScheduler once the tile request has finished", async function () {
    worker.use(http.get("https://tiles.example.com/*", pngResponse));
    spyOn(scheduler, "update").and.callThrough();

    await loadTile();

    expect(scheduler.update).toHaveBeenCalled();
  });

  it("reports request errors with their HTTP status code", async function () {
    worker.use(
      http.get(
        "https://tiles.example.com/*",
        () => new HttpResponse(null, { status: 404 })
      )
    );
    const reported = new Promise<TileProviderError>((resolve) =>
      imageryProvider.errorEvent.addEventListener(resolve)
    );

    layer.createTile(coords, () => {});
    const error = await reported;

    expect((error.error as any).statusCode).toBe(404);
  });

  it("calls done with the error and shows the error tile when a request fails", async function () {
    worker.use(
      http.get(
        "https://tiles.example.com/*",
        () => new HttpResponse(null, { status: 404 })
      )
    );

    let tile!: HTMLImageElement;
    const error = await new Promise<unknown>((resolve) => {
      tile = layer.createTile(coords, resolve) as HTMLImageElement;
    });

    expect((error as any).statusCode).toBe(404);
    expect(tile.getAttribute("src")).toBe(ERROR_TILE_URL);
  });

  it("calls done with the error when the image can't be decoded", async function () {
    worker.use(
      http.get(
        "https://tiles.example.com/*",
        () =>
          new HttpResponse("not an image", {
            headers: { "Content-Type": "image/png" }
          })
      )
    );
    const errorListener = jasmine.createSpy("errorListener");
    imageryProvider.errorEvent.addEventListener(errorListener);

    const error = await new Promise<unknown>((resolve) => {
      layer.createTile(coords, resolve);
    });

    expect(error).toBeDefined();
    expect(errorListener).toHaveBeenCalledTimes(1);
  });

  it("aborts a pending tile when Leaflet changes zoom", async function () {
    const { received, releaseResponse } = holdResponses();
    const errorListener = jasmine.createSpy("errorListener");
    imageryProvider.errorEvent.addEventListener(errorListener);
    const tileabort = jasmine.createSpy("tileabort");
    layer.on("tileabort", tileabort);
    const done = jasmine.createSpy("done");

    const tile = layer.createTile(coords, done) as HTMLImageElement;
    await received;
    abortOnZoomChange(tile);
    releaseResponse();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(tileabort).toHaveBeenCalledWith(
      jasmine.objectContaining({ tile, coords })
    );
    expect((layer as any)._tiles).toEqual({});
    expect(tile.getAttribute("src")).toBeNull();
    expect(done).not.toHaveBeenCalled();
    expect(errorListener).not.toHaveBeenCalled();
  });

  it("leaves tiles at the current zoom loading when Leaflet changes zoom", async function () {
    const { received, releaseResponse } = holdResponses();

    const loaded = loadTile();
    await received;
    const internals = layer as any;
    internals._tiles = {};
    internals._tileZoom = coords.z + 1;
    internals._abortLoading();
    releaseResponse();

    expect((await loaded).src).toMatch(/^blob:/);
  });

  it("releases the RequestScheduler server slot of an unloaded tile", async function () {
    let requestReceived!: () => void;
    const received = new Promise<void>((resolve) => {
      requestReceived = resolve;
    });
    worker.use(
      http.get("https://tiles.example.com/*", async () => {
        requestReceived();
        await new Promise(() => {});
        return pngResponse();
      })
    );
    const serverKey = scheduler.getServerKey(
      "https://tiles.example.com/3/1/2.png"
    );
    const activeBefore = scheduler.numberOfActiveRequestsByServer(serverKey);

    const tile = layer.createTile(coords, () => {});
    await received;
    expect(scheduler.numberOfActiveRequestsByServer(serverKey)).toBe(
      activeBefore + 1
    );

    layer.fire("tileunload", { tile, coords });

    expect(scheduler.numberOfActiveRequestsByServer(serverKey)).toBe(
      activeBefore
    );
  });
});
