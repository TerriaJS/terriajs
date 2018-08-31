const clone = require('terriajs-cesium/Source/Core/clone');
const defined = require('terriajs-cesium/Source/Core/defined');
const defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
const Resource = require('terriajs-cesium/Source/Core/Resource');

function loadJsonp(urlOrResource, callbackParameterName, request) {
    var proxy;
    var queryParameters;
    if (typeof callbackParameterName === 'object') {
        var options = callbackParameterName;
        if (defined(options.parameters)) {
            queryParameters = clone(options.parameters);
        }
        if (defined(options.proxy)) {
            proxy = options.proxy;
        }
        callbackParameterName = options.callbackParameterName;
    }

    var resource = Resource.createIfNeeded(urlOrResource, {
        proxy : proxy,
        queryParameters : queryParameters,
        request: request
    });

    return resource.fetchJsonp(callbackParameterName);
}

defineProperties(loadJsonp, {
    loadAndExecuteScript : {
        get : function() {
            return Resource._Implementations.loadAndExecuteScript;
        },
        set : function(value) {
            Resource._Implementations.loadAndExecuteScript = value;
        }
    },

    defaultLoadAndExecuteScript : {
        get : function() {
            return Resource._DefaultImplementations.loadAndExecuteScript;
        }
    }
});

module.exports = loadJsonp;
