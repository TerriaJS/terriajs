'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

function renderAndSubscribe(that, renderFunction) {
    return knockout.ignoreDependencies(function() {
        // If there's already a cleanup function, call it now to clean up any previous changes.
        if (that.__terriaRenderAndSubscribeCleanup) {
            that.__terriaRenderAndSubscribeCleanup();
        }

        // Create a cleanup function to undo the changes we're about to make.
        var changeSubscription;
        var previousComponentWillUnmount;

        that.__terriaRenderAndSubscribeCleanup = function() {
            if (defined(changeSubscription)) {
                changeSubscription.dispose();
                changeSubscription = undefined;
            }

            if (defined(previousComponentWillUnmount)) {
                that.componentWillUnmount = previousComponentWillUnmount;
                previousComponentWillUnmount = undefined;
            }

            that.__terriaRenderAndSubscribeCleanup = undefined;
        };

        // Create a computed observable from the render function.
        var computed = knockout.computed(renderFunction, that);

        // Arrange to unsubscribe from the computed observable if the component unmounts.
        // This avoids a memory leak.
        previousComponentWillUnmount = that.componentWillUnmount;

        function componentWillUnmount() {
            if (defined(that.__terriaRenderAndSubscribeCleanup)) {
                that.__terriaRenderAndSubscribeCleanup();
            }

            if (definedNotNull(that.componentWillUnmount)) {
                that.componentWillUnmount();
            }
        }

        that.componentWillUnmount = componentWillUnmount;

        // Subscribe to change notification on the computed observable (the render function).
        // TODO: this probably ends up calling renderFunction twice: once to recompute the value of the
        //       computed observable, and again after the forceUpdate for a new computed observable.
        //       Can we avoid this somehow?
        changeSubscription = computed.subscribe(function() {
            if (that.__terriaRenderAndSubscribeCleanup) {
                that.__terriaRenderAndSubscribeCleanup();
                that.forceUpdate();
            }
        });


        return computed();
    });
}

module.exports = renderAndSubscribe;
