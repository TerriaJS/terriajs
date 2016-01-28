'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var ObserveModelMixin = {
    componentWillMount: function() {
        this.__observeModelChangeSubscription = undefined;

        var originalRender = this.render;

        this.render = function() {
            var that = this;
            var isFirstRender = true;

            // Clean up the previous subscription, if any.
            disposeSubscription(that);

            // Ignore dependencies so that the parent component's render function does not
            // depend on the child component's render function.  If it did, a change to a child
            // would trigger re-rendering of all its ancestors, which is wasteful.

            return knockout.ignoreDependencies(function() {
                var computed = knockout.pureComputed(function() {
                    // The first time our computed render function is called, pass through to the real
                    // render and track dependencies along the way.  Any time after that is a result of
                    // a change in one of the properties that the render used.  But if we re-evaluate
                    // the render function there, we're stepping outside the normal React lifecycle.
                    // Instead, unsubscribe from the computed observable and force an update of the
                    // React component (which will create a new computed observable).
                    if (isFirstRender) {
                        isFirstRender = false;
                        return originalRender.call(that);
                    }
                });

                that.__observeModelChangeSubscription = computed.subscribe(function() {
                    disposeSubscription(that);
                    that.forceUpdate();
                });

                return computed();
            });
        };
    },

    componentWillUnmount: function() {
        disposeSubscription(this);
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        return !modelEqual(this.props, nextProps) || !modelEqual(this.state, nextState);
    }
};

function disposeSubscription(component) {
    if (defined(component.__observeModelChangeSubscription)) {
        component.__observeModelChangeSubscription.dispose();
        component.__observeModelChangeSubscription = undefined;
    }
}

// This is just React's shallowEqual except that
function modelEqual(left, right) {
    if (left === right) {
        return true;
    }

    if (typeof left !== 'object' || left === null ||
        typeof right !== 'object' || right === null) {
        return false;
    }


}

module.exports = ObserveModelMixin;
