var ImageryProvider = require("terriajs-cesium/Source/Scene/ImageryProvider")
  .default;
var URI = require("urijs");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

function getUrlForImageryTile(imageryProvider, x, y, level) {
  const oldLoadImage = ImageryProvider.loadImage;

  let tileUrl;
  try {
    ImageryProvider.loadImage = function(imageryProvider, url) {
      if (typeof url === "string" || url instanceof String) {
        tileUrl = url;
      } else if (url && url.url) {
        tileUrl = url.url;

        // Add the Cesium Ion access token if there is one.
        if (url._ionEndpoint && url._ionEndpoint.accessToken) {
          tileUrl = new URI(tileUrl)
            .addQuery("access_token", url._ionEndpoint.accessToken)
            .toString();
        }
      }
      return when();
    };

    imageryProvider.requestImage(x, y, level);
  } finally {
    ImageryProvider.loadImage = oldLoadImage;
  }

  return tileUrl;
}

module.exports = getUrlForImageryTile;
