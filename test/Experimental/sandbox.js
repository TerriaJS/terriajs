'use strict';

import {
    createStore,
    applyMiddleware
}
from 'redux';

// import thunk from 'redux-thunk';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import defined from 'terriajs-cesium/Source/Core/defined';

describe('sandbox', function() {
    it('does stuff', function() {

        function customThunkMiddleware({ dispatch, getState }) {
            // TODO: get the object from the state, instead of assuming they're the same thing.

            return next => action => {
                if (typeof action === 'function') {
                    return action(dispatch, getState).then(function(result) {
                        return {
                            me: getState(),
                            result: result
                        };
                    });
                } else {
                    return {
                        result: next(action),
                        me: getState()
                    };
                }
            };
        }

        function dispatchToMe(dispatch, getState, me, action) {

            var result = dispatch(action);
            if (defined(result) && defined(result.then)) {
                return result.then(function(result) {
                    return {
                        me: getState(),
                        result: result
                    }
                });
            } else {
                return getState();
            }
        }

        function resolvedPromise(me) {
            return when({
                me: me,
                result: undefined
            });
        }

        class CatalogItem {
            constructor() {
                this.isLoading = false;
                this.isEnabled = false;
                this.isShown = false;
            }

            assign(changes) {
                return Object.assign(new this.constructor(), this, changes);
            }

            load() {
                var that = this;
                return function(dispatch) {
                    that = dispatch({
                        type: 'UPDATE',
                        changes: {
                            isLoading: true
                        }
                    }).me;

                    return dispatch(that._doLoad()).then(function(dispatchResult) {
                        that = dispatch({
                            type: 'UPDATE',
                            changes: {
                                isLoading: false
                            }
                        }).me;
                    });
                };
            }

            enable() {
                var that = dispatch({
                    type: 'UPDATE',
                    changes: {
                        isEnabled: true
                    }
                }).me;

                return that.load().then(function(that) {
                    // If the catalog item is still enabled after the load completes, do the actual enable and show it.
                    if (that.isEnabled) {
                        return that._doEnable().then(function(that) {
                            return that.show();
                        });
                    } else {
                        return that;
                    }
                });

                // var that = this;
                // return function(dispatch) {

                //     return dispatch(that.load()).then(function(dispatchResult) {
                //         // If the catalog item is still enabled after the load completes, do the actual enable and show it.
                //         if (dispatchResult.me.isEnabled) {
                //             return dispatch(dispatchResult.me._doEnable()).then(function(dispatchResult) {
                //                 return dispatch(dispatchResult.me.show());
                //             });
                //         }
                //     });
                // };
            }

            show() {
                var that = this;
                return function(dispatch) {
                    var promise;
                    if (!that.isEnabled) {
                        promise = dispatch(that.enable());
                    } else {
                        promise = resolvedPromise(that);
                    }

                    return promise.then(function(dispatchResult) {
                        that = dispatch({
                            type: 'UPDATE',
                            changes: {
                                isShown: true
                            }
                        }).me;

                        return dispatch(that._doShow());
                    });
                };
            }
        }

        class ImageryLayerCatalogItem extends CatalogItem {
            constructor() {
                super();
                this._imageryLayer = undefined;
            }

            createImageryLayer() {
            }

            _doEnable() {
                var that = this;
                return function(dispatch) {
                    that = dispatch({
                        type: 'UPDATE',
                        changes: {
                            _imageryLayer: that.createImageryLayer()
                        }
                    });
                    return resolvedPromise(that);
                };
            }

            _doShow() {
                var that = this;
                return function(dispatch) {
                    return resolvedPromise(that);
                };
            }
        }

        class WebMapServiceCatalogItem extends ImageryLayerCatalogItem {
            constructor() {
                super();
                this.url = undefined;
                this.layers = [];
                this.parameters = {};
            }

            _doLoad() {
                var that = this;
                return function(dispatch) {
                    return resolvedPromise(that);
                };
            }

            createImageryProvider() {
                return new WebMapServiceImageryProvider({
                    url: this.url,
                    layers: this.layers.join(',')
                });
            }
        }

        function catalogItemReducer(state = new WebMapServiceCatalogItem(), action) {
            if (action.type === 'UPDATE') {
                return state.assign(action.changes);
            } else {
                return state;
            }
        }

        // Create a Redux store holding the state of your app.
        // Its API is { subscribe, dispatch, getState }.
        let createStoreWithMiddleware = applyMiddleware(customThunkMiddleware)(createStore);
        let store = createStoreWithMiddleware(catalogItemReducer)

        expect(store.getState().isEnabled).toBe(false);

        store.dispatch(store.getState().enable());

        expect(store.getState().isEnabled).toBe(true);
    });
});
