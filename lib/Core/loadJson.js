const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadJson(urlOrResource, headers, request) {
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

    return resource.fetchJson();
}

module.exports = loadJson;
