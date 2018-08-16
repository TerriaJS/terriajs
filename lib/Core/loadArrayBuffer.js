const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadArrayBuffer(urlOrResource, headers, request) {
    var resource = Resource.createIfNeeded(urlOrResource, {
        headers: headers,
        request: request
    });

    return resource.fetchArrayBuffer();
}

module.exports = loadArrayBuffer;
