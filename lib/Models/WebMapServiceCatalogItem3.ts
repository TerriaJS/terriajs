// const mobx = require('mobx');
// const mobxUtils = require('mobx-utils');

// Problems in current architecture:
// 1. After loading, can't tell what user actually set versus what came from e.g. GetCapabilities.
//  Solution: layering
// 2. CkanCatalogItem producing a WebMapServiceCatalogItem on load
// 3. Observable spaghetti
//  Solution: think in terms of pipelines with computed observables, document patterns.
// 4. All code for all catalog item types needs to be loaded before we can do anything.

import { autorun, configure, computed, flow, runInAction, observable, onBecomeUnobserved, onBecomeObserved, trace, decorate, createAtom } from 'mobx';
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
import loadableSubset from './loadableSubset';

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
        trace();
        return [
            this._currentImageryLayer,
            //this._nextImageryLayer
        ];
    }


    private _createImageryLayer(time) {
        // Don't show anything on the map until GetCapabilities finishes loading.
        // Endless loop because if we return here, no one actually _uses_  any
        // of the getCapabilitiesLayer properties.
        this.getCapabilitiesLayer.loadIfNeeded();
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
        trace();
        return this._createImageryLayer(this.currentDiscreteTime);
    }

    @computed
    private get _nextImageryLayer() {
        trace();
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
            console.log('fetched ' + url);
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
                layer._urlWeLoadedFrom = url;
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
