import Resource from "terriajs-cesium/Source/Core/Resource";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import getUrlForImageryTile, {
  getResourceForImageryTile
} from "../../../lib/Map/ImageryProvider/getUrlForImageryTile";

function providerLoading(url: string | Resource | undefined): ImageryProvider {
  return {
    requestImage(this: ImageryProvider) {
      return url === undefined
        ? undefined
        : ImageryProvider.loadImage(this, url as any);
    }
  } as unknown as ImageryProvider;
}

describe("getResourceForImageryTile", function () {
  it("returns the Resource the provider would request, with its headers", function () {
    const provider = new UrlTemplateImageryProvider({
      url: new Resource({
        url: "https://tiles.example.com/{z}/{x}/{y}.png",
        headers: { Authorization: "Bearer test-token" }
      })
    });

    const resource = getResourceForImageryTile(provider, 1, 2, 3);

    expect(resource?.url).toBe("https://tiles.example.com/3/1/2.png");
    expect(resource?.headers).toEqual({ Authorization: "Bearer test-token" });
  });

  it("wraps string URLs in a Resource", function () {
    const resource = getResourceForImageryTile(
      providerLoading("https://tiles.example.com/tile.png"),
      0,
      0,
      0
    );

    expect(resource).toEqual(jasmine.any(Resource));
    expect(resource?.url).toBe("https://tiles.example.com/tile.png");
  });

  it("returns undefined if the provider doesn't load an image", function () {
    expect(
      getResourceForImageryTile(providerLoading(undefined), 0, 0, 0)
    ).toBeUndefined();
  });

  it("restores ImageryProvider.loadImage", function () {
    const loadImage = ImageryProvider.loadImage;
    getResourceForImageryTile(
      providerLoading("https://tiles.example.com/tile.png"),
      0,
      0,
      0
    );
    expect(ImageryProvider.loadImage).toBe(loadImage);
  });
});

describe("getUrlForImageryTile", function () {
  it("returns the tile URL", function () {
    expect(
      getUrlForImageryTile(
        providerLoading("https://tiles.example.com/tile.png"),
        0,
        0,
        0
      )
    ).toBe("https://tiles.example.com/tile.png");
  });

  it("adds the Cesium Ion access token of an IonResource", function () {
    const ionResource = Object.assign(
      new Resource({ url: "https://assets.cesium.com/1/tile.png" }),
      { _ionEndpoint: { accessToken: "ion-token" } }
    );

    expect(getUrlForImageryTile(providerLoading(ionResource), 0, 0, 0)).toBe(
      "https://assets.cesium.com/1/tile.png?access_token=ion-token"
    );
  });
});
