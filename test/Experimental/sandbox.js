import {
    createStore
}
from 'redux';

describe('sandbox', function() {
    it('does stuff', function() {
        class WebMapServiceCatalogItem {
            constructor() {
                this.url = undefined;
                this.layers = [];
                this.isEnabled = false;
            }

            assign(changes) {
                return Object.assign(new WebMapServiceCatalogItem(), this, changes);
            }

            enable() {
                return {
                    type: 'UPDATE',
                    changes: {
                        isEnabled: true
                    }
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
        let store = createStore(catalogItemReducer)

        expect(store.getState().isEnabled).toBe(false);

        store.dispatch(store.getState().enable());

        expect(store.getState().isEnabled).toBe(true);
    });
});
