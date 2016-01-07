import {
    createStore,
    applyMiddleware
}
from 'redux';

import thunk from 'redux-thunk';
import when from 'terriajs-cesium/Source/ThirdParty/when';

describe('sandbox', function() {
    it('does stuff', function() {

        class CatalogItem {
            constructor() {
                this.isEnabled = false;
                this.isLoading = false;
                this.isShown = false;
            }

            assign(changes) {
                return Object.assign(new this.constructor(), this, changes);
            }

            enable() {
                return dispatch => {
                    dispatch({
                        type: 'UPDATE',
                        changes: {
                            isEnabled: true
                        }
                    });

                    return dispatch(this.load()).then(function() {
                        // If the catalog item is still enabled after the load completes, do the actual enable and show it.
                        if (this.isEnabled) {
                            return dispatch(this._doEnable()).then(function() {
                                return dispatch(this.show());
                            });
                        }
                    });
                };
            }

            show() {
                return dispatch => {
                    var promise;
                    if (!this.isEnabled) {
                        promise = dispatch(this.enable());
                    } else {
                        promise = when();
                    }

                    return promise.then(function() {
                        dispatch({
                            type: 'UPDATE',
                            changes: {
                                isShown: true
                            }
                        });

                        return dispatch(this._doShow());
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
                return dispatch => {
                    dispatch({
                        type: 'UPDATE',
                        changes: {
                            _imageryLayer: this.createImageryLayer()
                        }
                    })
                };
            }

            _doShow() {
                return dispatch => {

                }
            }
        }

        class WebMapServiceCatalogItem extends ImageryLayerCatalogItem {
            constructor() {
                super();
                this.url = undefined;
                this.layers = [];
                this.parameters = {};
            }

            load() {
                return dispatch => {
                    dispatch({
                        type: 'UPDATE',
                        changes: {
                            isLoading: true
                        }
                    });
                    return when().then(function() {
                        dispatch({
                            type: 'UPDATE',
                            changes: {
                                isLoading: false
                            }
                        });
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
