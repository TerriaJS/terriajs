'use strict';

import arraysAreEqual from '../Core/arraysAreEqual';
import defined from 'terriajs-cesium/Source/Core/defined';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

const ObserveModelMixin = {
    componentWillMount() {
        this.__observeModelChangeSubscription = undefined;

        const originalRender = this.render;

        this.render = function renderForObservModelMixin() {
            const that = this;
            let isFirstRender = true;

            // Clean up the previous subscription, if any.
            disposeSubscription(that);

            // Ignore dependencies so that the parent component's render function does not
            // depend on the child component's render function.  If it did, a change to a child
            // would trigger re-rendering of all its ancestors, which is wasteful.

            return knockout.ignoreDependencies(function() {
                const computed = knockout.computed(function() {
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

                that.__observeModelChangeSubscription = [];

                // The computed observable should also depend on anything in this component's props
                // with a __knockoutSubscribable property.  This property is added to arrays
                // by knockout-es5 and is notified whenever the array is modified.
                for (const prop in that.props) {
                    if (that.props.hasOwnProperty(prop)) {
                        if (defined(that.props[prop]) && defined(that.props[prop].__knockoutSubscribable)) {
                            that.__observeModelChangeSubscription.push(that.props[prop].__knockoutSubscribable.subscribe(function() {
                                disposeSubscription(that);
                                that.forceUpdate();
                            }));
                        }
                    }
                }

                that.__observeModelChangeSubscription.push(computed.subscribe(function() {
                    disposeSubscription(that);
                    that.forceUpdate();
                }));

                return computed();
            });
        };
    },

    componentWillUnmount() {
        disposeSubscription(this);
    },

    shouldComponentUpdate(nextProps, nextState) {
        return !modelEqual(this.props, nextProps) || !modelEqual(this.state, nextState);
    }
};

function disposeSubscription(component) {
    if (defined(component.__observeModelChangeSubscription)) {
        for (let i = 0; i < component.__observeModelChangeSubscription.length; ++i) {
            component.__observeModelChangeSubscription[i].dispose();
        }
        component.__observeModelChangeSubscription = undefined;
    }
}

// This is just React's shallowEqual except that the contents of arrays are checked for equality.
// This is necessary because Knockout-style computed properties note a dependency when an array
// property is accessed, NOT when individual elements of that array are accessed.
function modelEqual(objA, objB) {
    if (objA === objB) {
        return true;
    }

    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
        return false;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    const bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);
    for (let i = 0; i < keysA.length; i++) {
        if (!bHasOwnProperty(keysA[i]) || !areSameValue(objA[keysA[i]], objB[keysA[i]])) {
            return false;
        }
    }

    return true;
}

function areSameValue(valueA, valueB) {
    if (valueA === valueB) {
        return true;
    } else if (Array.isArray(valueA) && Array.isArray(valueB)) {
        return arraysAreEqual(valueA, valueB);
    }

    return false;
}

module.exports = ObserveModelMixin;
