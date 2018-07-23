const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadArrayBuffer(urlOrResource, headers, request) {
    var resource;
    if (urlOrResource instanceof Resource) {
        resource = Resource.createIfNeeded(urlOrResource);
    } else {
        resource = new Resource({
            url: urlOrResource,
            headers: headers,
            request: request
        });
    }

    return resource.fetchArrayBuffer();
}

module.exports = loadArrayBuffer;
