// const mobx = require('mobx');
// const mobxUtils = require('mobx-utils');

// Problems in current architecture:
// 1. After loading, can't tell what user actually set versus what came from e.g. GetCapabilities.
//  Solution: layering
// 2. CkanCatalogItem producing a WebMapServiceCatalogItem on load
// 3. Observable spaghetti
//  Solution: think in terms of pipelines with computed observables, document patterns.
// 4. All code for all catalog item types needs to be loaded before we can do anything.

import { autorun, configure, computed, flow, runInAction, observable, onBecomeUnobserved, onBecomeObserved, trace, decorate } from 'mobx';
//import { promisedComputed } from 'computed-async-mobx';
import { createTransformer, now, fromPromise } from 'mobx-utils';
import * as fetch from 'node-fetch';
import loadableLayer, { LoadableLayerData } from './loadableLayer';
import autoUpdate from '../Core/autoUpdate';
import * as defined from 'terriajs-cesium/Source/Core/defined';
import WebMapServiceCatalogItemDefinition from '../Definitions/WebMapServiceCatalogItemDefinition';
//import { WebMapServiceCatalogItem } from '../Definitions/WebMapServiceCatalogItemInterface';
import CatalogMember, { CatalogMemberDefinition } from './CatalogMemberNew';
import { primitiveProperty } from './ModelProperties';
import { model, definition } from './Decorators';

const properties = WebMapServiceCatalogItemDefinition.properties;
// const GetCapabilitiesLayerProperties = [
//     properties.availableStyles,
//     properties.isGeoServer,
//     properties.isEsri,
//     properties.availableDimensions,
//     properties.isNcWms,
//     properties.supportsColorScaleRange,
//     properties.info,
//     properties.minScaleDenominator,
//     properties.getFeatureInfoFormats,
//     properties.rectangle,
//     properties.intervals,
//     properties.tilingScheme,
//     properties.colorScaleMinimum,
//     properties.colorScaleMaximum
// ];

class ImageryLayer {
}

class DataSource {
}

export class Definition extends CatalogMemberDefinition {
    @primitiveProperty({
        type: 'string',
        name: 'Is GeoServer',
        description: 'True if this WMS is a GeoServer; otherwise, false.',
        default: false
    })
    isGeoServer?: boolean;
}

type DefinitionLayer = Partial<Definition>;
type UserLayer = Partial<Definition>;

// type GetCapabilitiesLayerProperties =
//     'description' | 'isGeoServer';

// function create<T, E extends keyof T>(metadata: any[], e: any): Pick<T, E> {
//     return undefined;
// }

// create<Definition, GetCapabilitiesLayerProperties>((<any>Definition).metadata, GetCapabilitiesLayerProperties);

type Constructor<T> = new() => T;
type LoadableConstructor<T> = new(load: (T) => Promise<void>) => T;

function subset<T, T1 extends keyof T>(definition: Constructor<T>, first: T1): Constructor<Pick<T, T1>>;
function subset<T, T1 extends keyof T, T2 extends keyof T>(definition: Constructor<T>, first: T1, second: T2): Constructor<Pick<T, T1 | T2>>;
function subset(definition, ...properties): any {
    class Subset {
        constructor() {
            properties.forEach(property => {
                this[property] = undefined;
            });
        }

        // TODO: copy metadata for the subset of properties.
        //static readonly metadata = definition.metadata.filter(property => properties.indexOf(property) >= 0);
    }

    const decorators: any = {};
    properties.forEach(property => {
        decorators[property] = observable;
    });

    decorate(Subset, decorators);

    return Subset;
}

function loadableSubset<T, T1 extends keyof T>(definition: Constructor<T>, first: T1): LoadableConstructor<LoadableLayerData & Pick<T, T1>>;
function loadableSubset<T, T1 extends keyof T, T2 extends keyof T>(definition: Constructor<T>, first: T1, second: T2): LoadableConstructor<LoadableLayerData & Pick<T, T1 | T2>>;
function loadableSubset(definition, ...properties): any {
    const valuesTemplate: any = {};
    properties.forEach(property => {
        valuesTemplate[property] = undefined;
    });
    valuesTemplate.isLoading = false;

    class LoadableSubset {
        constructor(private readonly loadFunction: (LoadableSubset) => Promise<void>) {
        }

        @computed private get _privateValues() {
            const newValues = observable(valuesTemplate);

            runInAction(() => {
                newValues.isLoading = true;
            });

            newValues.loadPromise = this.loadFunction(newValues).then(() => {
                runInAction(() => {
                    newValues.isLoading = false;
                });
            }).catch(e => {
                runInAction(() => {
                    newValues.isLoading = false;
                });
                throw e;
            });

            return newValues;
        }

        @computed get loadPromise(): Promise<void> {
            return this._privateValues.loadPromise;
        }

        @computed get isLoading(): boolean {
            return this._privateValues.isLoading;
        }
    }

    properties.forEach(property => {
        Object.defineProperty(LoadableSubset.prototype, property, {
            get: function() {
                return this._privateValues[property];
            },
            set: function(newValue) {
                this._privateValues[property] = newValue;
            },
            enumerable: true,
            configurable: true
        });
    });

    const decorators: any = {};
    properties.forEach(property => {
        decorators[property] = computed;
    });

    decorate(LoadableSubset, decorators);

    return LoadableSubset;
}

const GetCapabilitiesLayer = loadableSubset(Definition, 'description', 'isGeoServer');

interface WebMapServiceCatalogItem extends Definition {}
@model(Definition)
class WebMapServiceCatalogItem extends CatalogMember {
    @observable modelLayers = ['getCapabilitiesLayer', /*'describeLayerLayer',*/ 'definitionLayer', 'userLayer'];
    @observable defaultLayerToModify = 'userLayer';

    @computed
    get getCapabilitiesLayer() {
        trace();
        return new GetCapabilitiesLayer(layer => this._loadGetCapabilitiesLayer(layer));
    }

    @observable definitionLayer: DefinitionLayer = {};

    @observable userLayer: UserLayer = {};

    @observable
    getCapabilitiesUrl = 'http://www.example.com'

    @observable
    currentDiscreteTime = '2018-01-01T00:00:00Z'

    @observable
    nextDiscreteTime = '2018-01-02T00:00:00Z'

    @computed
    get mapItems() {
        return [
            this._currentImageryLayer,
            this._nextImageryLayer
        ];
    }


    private _createImageryLayer(time) {
        // Don't show anything on the map until GetCapabilities finishes loading.
        if (this.getCapabilitiesLayer.isLoading) {
            return undefined;
        }

        return {
            wms: true,
            isGeoServer: this.isGeoServer,
            alpha: 1.0
        };

        // return new WebMapServiceImageryProvider({
        //     url: this.url,
        //     layers: this.layers,
        //     getFeatureInfoFormats: this.getFeatureInfoFormats,
        //     parameters: parameters,
        //     getFeatureInfoParameters: parameters,
        //     tilingScheme: defined(this.tilingScheme) ? this.tilingScheme : new WebMercatorTilingScheme(),
        //     maximumLevel: maximumLevel
        // });
    }

    @computed
    @autoUpdate(layer => {
        layer.alpha = this.opacity;
    })
    private get _currentImageryLayer() {
        return this._createImageryLayer(this.currentDiscreteTime);
    }

    @computed
    private get _nextImageryLayer() {
        const layer = this._createImageryLayer(this.nextDiscreteTime);
        if (layer) {
            layer.alpha = 0.0;
        }
        return layer;
    }

    private _loadGetCapabilitiesLayer(layer) {
        console.log('fetching ' + this.getCapabilitiesUrl);
        const url = this.getCapabilitiesUrl;
        return fetch(url).then(response => {
            //console.log('fetched ' + url);
            //const xml = response.xml();
            //const capabilities = xml; // TODO
            const capabilities = {
                Service: {
                    KeywordList: {
                        Keyword: ['GEOSERVER']
                    }
                }
            };

            runInAction(() => {
                layer.isGeoServer =
                    defined(capabilities) &&
                    defined(capabilities.Service) &&
                    defined(capabilities.Service.KeywordList) &&
                    defined(capabilities.Service.KeywordList.Keyword) &&
                    capabilities.Service.KeywordList.Keyword.indexOf('GEOSERVER') >= 0;
            });

            return layer;
        });
    }

}

//mixCatalogMember(WebMapServiceCatalogItem);

export default WebMapServiceCatalogItem;

class Cesium {
    scene: any;

    constructor(terria) {
        autorun(() => {
            terria.nowViewing.items.forEach(workbenchItem => {
                const mapItems = workbenchItem.mapItems;
                if (!mapItems) {
                    return;
                }

                mapItems.forEach(mapItem => {
                    // TODO: Look up the type in a map and call the associated function.
                    //       That way the supported types of map items is extensible.
                    if (mapItem instanceof ImageryLayer) {
                        this.scene.imageryLayers.add(mapItem);
                    } else if (mapItem instanceof DataSource) {
                        this.scene.dataSources.add(mapItem);
                    }
                });
            });
        });
    }
}

// runInAction(() => {
//     wms.getCapabilitiesUrl = 'http://www.example.com/something';
// });

// autorun(() => {
//     console.log('mapItems: ' + wms.mapItems);
// });

// setTimeout(() => {
//     runInAction(() => {
//         wms.getCapabilitiesUrl = 'http://www.example.com/another';
//     });
// });



//console.log(wms.getCapabilitiesLayer.get('isGeoServer'));
