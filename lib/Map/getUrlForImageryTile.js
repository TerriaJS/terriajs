var ImageryProvider = require('terriajs-cesium/Source/Scene/ImageryProvider');
var when = require('terriajs-cesium/Source/ThirdParty/when');

function getUrlForImageryTile(imageryProvider, x, y, level) {
    const oldLoadImage = ImageryProvider.loadImage;

    let tileUrl;
    try {
        ImageryProvider.loadImage = function(imageryProvider, url) {
            if (typeof url === 'string' || url instanceof String) {
                tileUrl = url;
            } else if (url && url.url) {
                tileUrl = url.url;
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
