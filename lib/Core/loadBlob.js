const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadBlob(urlOrResource, headers, request) {
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

    return resource.fetchBlob();
}

module.exports = loadBlob;
