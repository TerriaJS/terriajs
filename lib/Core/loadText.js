const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadText(urlOrResource, headers, request) {
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

    return resource.fetchText();
}

module.exports = loadText;
