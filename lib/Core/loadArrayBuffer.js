const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadArrayBuffer(urlOrResource) {
    var resource = Resource.createIfNeeded(urlOrResource);
    return resource.fetchArrayBuffer();
}

module.exports = loadArrayBuffer;
