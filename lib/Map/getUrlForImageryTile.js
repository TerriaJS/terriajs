var ImageryProvider = require('terriajs-cesium/Source/Scene/ImageryProvider');
var throttleRequestByServer = require('terriajs-cesium/Source/Core/throttleRequestByServer');
var when = require('terriajs-cesium/Source/ThirdParty/when');

function getUrlForImageryTile(imageryProvider, x, y, level) {
    const oldMaxRequests = throttleRequestByServer.maximumRequestsPerServer;
    const oldLoadImage = ImageryProvider.loadImage;

    let tileUrl;
    try {
        throttleRequestByServer.maximumRequestsPerServer = Number.MAX_SAFE_INTEGER;

        ImageryProvider.loadImage = function(imageryProvider, url) {
            tileUrl = url;
            return when();
        }

        imageryProvider.requestImage(x, y, level);
    } catch(e) {
    }

    throttleRequestByServer.maximumRequestsPerServer = oldMaxRequests;
    ImageryProvider.loadImage = oldLoadImage;

    return tileUrl;
}

module.exports = getUrlForImageryTile;
