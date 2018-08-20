const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadJson(urlOrResource, headers, request) {
    var resource = Resource.createIfNeeded(urlOrResource, {
        headers: headers,
        request: request
    });

    return resource.fetchJson();
}

module.exports = loadJson;
