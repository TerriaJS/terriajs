import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import URI from "urijs";
import Resource from "terriajs-cesium/Source/Core/Resource";

/**
 * Capture the Resource the imagery provider would request for a tile, without
 * requesting it.
 */
export function getResourceForImageryTile(
  imageryProvider: ImageryProvider,
  x: number,
  y: number,
  level: number
): Resource | undefined {
  const oldLoadImage = ImageryProvider.loadImage;

  let tileResource: Resource | undefined;
  try {
    ImageryProvider.loadImage = function (
      _imageryProvider: ImageryProvider,
      url: string | Resource
    ) {
      if (typeof url === "string" || url instanceof String) {
        tileResource = new Resource({ url: url.toString() });
      } else if (url.url) {
        tileResource = url;
      }
      return undefined;
    };

    imageryProvider.requestImage(x, y, level);
  } finally {
    ImageryProvider.loadImage = oldLoadImage;
  }

  return tileResource;
}

function getUrlForImageryTile(
  imageryProvider: ImageryProvider,
  x: number,
  y: number,
  level: number
): string | undefined {
  const resource = getResourceForImageryTile(imageryProvider, x, y, level);
  if (!resource) {
    return undefined;
  }

  // Add the Cesium Ion access token if there is one (for an IonResource).
  const ionAccessToken = (resource as any)._ionEndpoint?.accessToken;
  return ionAccessToken
    ? new URI(resource.url).addQuery("access_token", ionAccessToken).toString()
    : resource.url;
}

export default getUrlForImageryTile;
