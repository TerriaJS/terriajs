'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

function renderAndSubscribe(that, renderFunction) {
    return knockout.ignoreDependencies(function() {
        var computed = knockout.computed(renderFunction, that);
        var subscription = computed.subscribe(function() {
            subscription.dispose();
            that.forceUpdate();
        });
        return computed();
    });
}

module.exports = renderAndSubscribe;
