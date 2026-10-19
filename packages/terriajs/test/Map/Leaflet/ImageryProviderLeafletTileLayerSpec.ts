import L from "leaflet";
import { http, HttpResponse } from "msw";
import RequestScheduler from "terriajs-cesium/Source/Core/RequestScheduler";
import Resource from "terriajs-cesium/Source/Core/Resource";
import TileProviderError from "terriajs-cesium/Source/Core/TileProviderError";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import ImageryProviderLeafletTileLayer from "../../../lib/Map/Leaflet/ImageryProviderLeafletTileLayer";
import Leaflet from "../../../lib/Models/Leaflet";
import { worker } from "../../mocks/browser";

// RequestScheduler internals aren't part of Cesium's type definitions
const scheduler = RequestScheduler as any;

const PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
  ),
  (c) => c.charCodeAt(0)
);

const pngResponse = () =>
  new HttpResponse(PNG, { headers: { "Content-Type": "image/png" } });

describe("ImageryProviderLeafletTileLayer", function () {
  const coords = Object.assign(L.point(1, 2), { z: 3 }) as L.Coords;
  let imageryProvider: UrlTemplateImageryProvider;
  let layer: ImageryProviderLeafletTileLayer;

  beforeEach(function () {
    imageryProvider = new UrlTemplateImageryProvider({
      url: new Resource({
        url: "https://tiles.example.com/{z}/{x}/{y}.png",
        headers: { Authorization: "Bearer test-token" }
      })
    });
    layer = new ImageryProviderLeafletTileLayer({} as Leaflet, imageryProvider);
  });

  afterEach(function () {
    ImageryProviderLeafletTileLayer.loadTilesWithResource = false;
    scheduler.clearForSpecs();
  });

  function loadTile() {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const tile = layer.createTile(coords, (error) =>
        error ? reject(error) : resolve(tile as HTMLImageElement)
      );
    });
  }

  it("sets the tile URL as the image src by default", function () {
    worker.use(http.get("https://tiles.example.com/*", pngResponse));

    const tile = layer.createTile(coords, () => {}) as HTMLImageElement;

    expect(tile.src).toBe("https://tiles.example.com/3/1/2.png");
  });

  describe("with loadTilesWithResource", function () {
    beforeEach(function () {
      ImageryProviderLeafletTileLayer.loadTilesWithResource = true;
    });

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

    it("revokes the blob URL once the tile has loaded", async function () {
      worker.use(http.get("https://tiles.example.com/*", pngResponse));
      spyOn(URL, "revokeObjectURL").and.callThrough();

      const tile = await loadTile();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(tile.src);
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

    it("doesn't show the tile once it has been aborted", async function () {
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
      const errorListener = jasmine.createSpy("errorListener");
      imageryProvider.errorEvent.addEventListener(errorListener);
      const done = jasmine.createSpy("done");

      const tile = layer.createTile(coords, done) as HTMLImageElement;
      await received;
      layer.fire("tileabort", { tile, coords });
      releaseResponse();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(tile.getAttribute("src")).toBeNull();
      expect(done).not.toHaveBeenCalled();
      expect(errorListener).not.toHaveBeenCalled();
    });

    it("releases the RequestScheduler server slot of an aborted tile", async function () {
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

      layer.fire("tileabort", { tile, coords });
      scheduler.update();

      expect(scheduler.numberOfActiveRequestsByServer(serverKey)).toBe(
        activeBefore
      );
    });
  });
});
