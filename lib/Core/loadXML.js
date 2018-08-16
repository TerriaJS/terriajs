const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadXML(urlOrResource, headers, request) {
    var resource = Resource.createIfNeeded(urlOrResource, {
        headers: headers,
        request: request
    });

    return resource.fetchXML();
}

module.exports = loadXML;
