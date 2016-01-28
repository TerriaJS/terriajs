'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import PureRenderMixin from 'react-addons-pure-render-mixin';

const ObserveModelMixin = {
    componentWillMount() {
        this.__observeModelChangeSubscriptions = undefined;

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

                that.__observeModelChangeSubscriptions = [];

                function disposeAndForceUpdate() {
                    disposeSubscription(that);
                    that.forceUpdate();
                }

                // We also need to update on change of anything in props with a __knockoutSubscribable property.  This
                // property is added to arrays by knockout-es5 and is notified whenever the array is modified.
                for (const prop in that.props) {
                    if (that.props.hasOwnProperty(prop)) {
                        if (defined(that.props[prop]) && defined(that.props[prop].__knockoutSubscribable)) {

                            that.__observeModelChangeSubscriptions.push(that.props[prop].__knockoutSubscribable.subscribe(disposeAndForceUpdate));
                        }
                    }
                }

                that.__observeModelChangeSubscriptions.push(computed.subscribe(disposeAndForceUpdate));

                return computed();
            });
        };
    },

    componentWillUnmount() {
        disposeSubscription(this);
    },

    shouldComponentUpdate: PureRenderMixin.shouldComponentUpdate
};

function disposeSubscription(component) {
    if (defined(component.__observeModelChangeSubscriptions)) {
        for (let i = 0; i < component.__observeModelChangeSubscriptions.length; ++i) {
            component.__observeModelChangeSubscriptions[i].dispose();
        }
        component.__observeModelChangeSubscriptions = undefined;
    }
}

module.exports = ObserveModelMixin;
