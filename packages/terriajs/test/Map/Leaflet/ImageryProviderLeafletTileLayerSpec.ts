import L from "leaflet";
import { http, HttpResponse } from "msw";
import Resource from "terriajs-cesium/Source/Core/Resource";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import ImageryProviderLeafletTileLayer from "../../../lib/Map/Leaflet/ImageryProviderLeafletTileLayer";
import Leaflet from "../../../lib/Models/Leaflet";
import { worker } from "../../mocks/browser";

const PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
  ),
  (c) => c.charCodeAt(0)
);

describe("ImageryProviderLeafletTileLayer", function () {
  it("sets the tile URL as the image src", async function () {
    worker.use(
      http.get(
        "https://tiles.example.com/*",
        () =>
          new HttpResponse(PNG, { headers: { "Content-Type": "image/png" } })
      )
    );
    const coords = Object.assign(L.point(1, 2), { z: 3 }) as L.Coords;
    const layer = new ImageryProviderLeafletTileLayer(
      {} as Leaflet,
      new UrlTemplateImageryProvider({
        url: new Resource({ url: "https://tiles.example.com/{z}/{x}/{y}.png" })
      })
    );

    const tile = await new Promise<HTMLImageElement>((resolve) => {
      const tile = layer.createTile(coords, () =>
        resolve(tile as HTMLImageElement)
      );
    });

    expect(tile.src).toBe("https://tiles.example.com/3/1/2.png");
  });
});
