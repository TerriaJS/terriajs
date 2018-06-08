const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadText(urlOrResource, headers, request) {
    var resource = Resource.createIfNeeded(urlOrResource, {
        headers: headers,
        request: request
    });

    return resource.fetchText();
}

module.exports = loadText;
