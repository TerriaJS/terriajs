'use strict';

import {
    createStore,
    applyMiddleware
}
from 'redux';

import thunk from 'redux-thunk';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import defined from 'terriajs-cesium/Source/Core/defined';

describe('sandbox', function() {
    it('does stuff', function() {

        function dispatchToMe(dispatch, getState, me, action) {
            // TODO: get the object from the state, instead of assuming they're the same thing.

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
                var me = this;
                return (dispatch, getState) => {
                    me = dispatchToMe(dispatch, getState, me, {
                        type: 'UPDATE',
                        changes: {
                            isLoading: true
                        }
                    });

                    return dispatchToMe(dispatch, getState, me, me._doLoad()).then(dispatchResult => {
                        dispatch({
                            type: 'UPDATE',
                            changes: {
                                isLoading: false
                            }
                        });
                    });
                };
            }

            enable() {
                return (dispatch, getState) => {
                    var me = dispatchToMe(dispatch, getState, this, {
                        type: 'UPDATE',
                        changes: {
                            isEnabled: true
                        }
                    });

                    return dispatchToMe(dispatch, getState, me, me.load()).then(dispatchResult => {
                        // If the catalog item is still enabled after the load completes, do the actual enable and show it.
                        if (dispatchResult.me.isEnabled) {
                            return dispatchToMe(dispatch, getState, dispatchResult.me, dispatchResult.me._doEnable()).then(dispatchResult => {
                                return dispatchToMe(dispatch, getState, dispatchResult.me, this.show());
                            });
                        }
                    });
                };
            }

            show() {
                return (dispatch, getState) => {
                    var promise;
                    if (!this.isEnabled) {
                        promise = dispatchToMe(dispatch, getState, this, this.enable());
                    } else {
                        promise = when({
                            me: this
                        });
                    }

                    return promise.then(dispatchResult => {
                        dispatch({
                            type: 'UPDATE',
                            changes: {
                                isShown: true
                            }
                        });

                        return dispatchToMe(dispatch, getState, dispatchResult.me, dispatchResult.me._doShow());
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
                return (dispatch, getState) => {
                    var me = dispatchToMe(dispatch, getState, this, {
                        type: 'UPDATE',
                        changes: {
                            _imageryLayer: this.createImageryLayer()
                        }
                    });
                    return when({
                        me: me
                    });
                };
            }

            _doShow() {
                return (dispatch, getState) => {
                    return when({
                        me: this
                    });
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
                return (dispatch, getState) => {
                    return when({
                        me: this
                    });
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
        let createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
        let store = createStoreWithMiddleware(catalogItemReducer)

        expect(store.getState().isEnabled).toBe(false);

        store.dispatch(store.getState().enable());

        expect(store.getState().isEnabled).toBe(true);
    });
});
