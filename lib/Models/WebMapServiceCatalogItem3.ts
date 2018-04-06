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
import { createTransformer, now, fromPromise } from 'mobx-utils';
import * as fetch from 'node-fetch';
import autoUpdate from '../Core/autoUpdate';
import * as defined from 'terriajs-cesium/Source/Core/defined';
import CatalogMember, { CatalogMemberDefinition } from './CatalogMemberNew';
import { primitiveProperty } from './ModelProperties';
import { model, definition } from './Decorators';
import defineLoadableStratum from './defineLoadableStratum';
import defineStratum from './defineStratum';
import * as JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

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
    isGeoServer: boolean;

    @primitiveProperty({
        type: 'string',
        name: 'GetCapabilities URL',
        description: 'The URL at which to access to the WMS GetCapabilities.'
    })
    getCapabilitiesUrl: string;

    intervals: any; // TODO
}

const GetCapabilitiesStratum = defineLoadableStratum(Definition, 'description', 'isGeoServer');
const FullStratum = defineStratum(Definition);

interface WebMapServiceCatalogItem extends Definition {}

@model(Definition)
class WebMapServiceCatalogItem extends CatalogMember {
    readonly flattened: Definition;

    @observable modelStrata = ['getCapabilitiesStratum', /*'describeLayerLayer',*/ 'definitionStratum', 'userStratum'];
    @observable defaultStratumToModify = 'userStratum';

    readonly getCapabilitiesStratum  = new GetCapabilitiesStratum(layer => this._loadGetCapabilitiesStratum(layer));
    readonly definitionStratum = new FullStratum();
    readonly userStratum = new FullStratum();

    @computed
    get getCapabilitiesUrl(): string {
        const getCapabilitiesUrl = this.flattened.getCapabilitiesUrl;
        if (getCapabilitiesUrl) {
            return getCapabilitiesUrl;
        } else if (this.url) {
            return this.url + 'GETCAPABILITIES'; // TODO
        } else {
            return undefined;
        }
    }
    set getCapabilitiesUrl(value: string) {
        this.flattened.getCapabilitiesUrl = value;
    }

    @computed
    get currentDiscreteTime(): string {
        return undefined; // TODO
    }

    @computed
    get nextDiscreteTime(): string {
        return undefined; // TODO
    }

    @computed
    get mapItems() {
        trace();
        return [
            this._currentImageryLayer,
            this._nextImageryLayer
        ];
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
        if (this.nextDiscreteTime) {
            const layer = this._createImageryLayer(this.nextDiscreteTime);
            if (layer) {
                layer.alpha = 0.0;
            }
            return layer;
        } else {
            return undefined;
        }
    }

    private _createImageryLayer(time) {
        // Don't show anything on the map until GetCapabilities finishes loading.
        // But do trigger loading so that we can eventually show something!
        this.getCapabilitiesStratum.loadIfNeeded();
        if (this.getCapabilitiesStratum.isLoading) {
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

    private _loadGetCapabilitiesStratum(values: typeof GetCapabilitiesStratum.TLoadValue): Promise<void> {
        // How do we avoid loading GetCapabilities if it's already been loaded?
        // For example, if this catalog item was created by a group, we don't want
        // to load the same GetCapabilities for every item in the group.
        // Maybe extract GetCapabilities loading and parsing into a pipeline
        // of createTransformer functions.
        // e.g. one function takes a URL and returns a representation object of
        // GetCapabilities. A function on that object takes a layer name
        // and returns the details for that layer.

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
                values.isGeoServer =
                    defined(capabilities) &&
                    defined(capabilities.Service) &&
                    defined(capabilities.Service.KeywordList) &&
                    defined(capabilities.Service.KeywordList.Keyword) &&
                    capabilities.Service.KeywordList.Keyword.indexOf('GEOSERVER') >= 0;
            });

            return values;
        });
    }
}

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
