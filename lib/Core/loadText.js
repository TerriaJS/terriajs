const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadText(urlOrResource) {
    var resource = Resource.createIfNeeded(urlOrResource);
    return resource.fetchText();
}

module.exports = loadText;
