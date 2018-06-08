const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadBlob(urlOrResource, headers, request) {
    var resource = Resource.createIfNeeded(urlOrResource, {
        headers: headers,
        request: request
    });

    return resource.fetchBlob();
}

module.exports = loadBlob;
