// const mobx = require('mobx');
// const mobxUtils = require('mobx-utils');
// Problems in current architecture:
// 1. After loading, can't tell what user actually set versus what came from e.g. GetCapabilities.
//  Solution: layering
// 2. CkanCatalogItem producing a WebMapServiceCatalogItem on load
// 3. Observable spaghetti
//  Solution: think in terms of pipelines with computed observables, document patterns.
// 4. All code for all catalog item types needs to be loaded before we can do anything.
import { computed, observable, runInAction, trace } from 'mobx';
import * as URI from 'urijs';
import LoadableStratum from '../../test/Models/LoadableStratum';
import autoUpdate from '../Core/autoUpdate';
import isReadOnlyArray from '../Core/isReadOnlyArray';
import * as TerriaError from '../Core/TerriaError';
import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GetCapabilitiesMixin from '../ModelMixins/GetCapabilitiesMixin';
import UrlMixin from '../ModelMixins/UrlMixin';
import WebMapServiceCatalogItemTraits from '../Traits/WebMapServiceCatalogItemTraits';
import { LoadableStratumState } from './defineLoadableStratum';
import Mappable, { ImageryLayer } from './Mappable';
import Model from './Model';
import * as proxyCatalogItemUrl from './proxyCatalogItemUrl';
import Terria from './TerriaNew';
import WebMapServiceCapabilities, { CapabilitiesLayer, CapabilitiesStyle } from './WebMapServiceCapabilities';

interface LegendUrl {
    url: string;
    mimeType?: string;
}

interface WebMapServiceStyle {
    name: string;
    title: string;
    abstract?: string;
    legendUrl?: LegendUrl;
}

interface WebMapServiceStyles {
    [layerName: string]: WebMapServiceStyle[];
}

class GetCapabilitiesStratum extends LoadableStratum implements WebMapServiceCatalogItemTraits {
    constructor(readonly catalogItem: WebMapServiceCatalogItem) {
        super();
    }

    @observable
    private _capabilities: WebMapServiceCapabilities | undefined;

    load(): Promise<void> {
        this._capabilities = undefined;

        if (this.catalogItem.getCapabilitiesUrl === undefined) {
            return Promise.reject(new TerriaError({
                title: 'Unable to load GetCapabilities',
                message: 'Could not load the Web Map Service (WMS) GetCapabilities document because the catalog item does not have a `url`.'
            }));
        }

        const proxiedUrl = proxyCatalogItemUrl(this.catalogItem, this.catalogItem.getCapabilitiesUrl, this.catalogItem.getCapabilitiesCacheDuration);
        return WebMapServiceCapabilities.fromUrl(proxiedUrl).then(capabilities => {
            runInAction(() => {
                this._capabilities = capabilities;
            });
        });
    }

    @computed
    get capabilities(): WebMapServiceCapabilities | undefined {
        this.loadIfNeeded();
        return this._capabilities;
    }

    @computed
    get capabilitiesLayers(): ReadonlyMap<string, CapabilitiesLayer | undefined> {
        const lookup: (name: string) => [string, CapabilitiesLayer | undefined] = name => [name, this.capabilities && this.capabilities.findLayer(name)];
        return new Map(this.catalogItem.layersArray.map(lookup));
    }

    @computed
    get availableStyles(): WebMapServiceStyles {
        const result: WebMapServiceStyles = {};

        if (!this.capabilities) {
            return result;
        }

        const capabilitiesLayers = this.capabilitiesLayers;

        for (const layerTuple of capabilitiesLayers) {
            const layerName = layerTuple[0];
            const layer = layerTuple[1];

            const styles: ReadonlyArray<CapabilitiesStyle> = layer ? this.capabilities.getInheritedValues(layer, 'Style') : [];
            result[layerName] = styles.map(style => {
                var wmsLegendUrl = isReadOnlyArray(style.LegendURL) ? style.LegendURL[0] : style.LegendURL;

                var legendUri, legendMimeType;
                if (wmsLegendUrl && wmsLegendUrl.OnlineResource && wmsLegendUrl.OnlineResource['xlink:href']) {
                    legendUri = new URI(decodeURIComponent(wmsLegendUrl.OnlineResource['xlink:href']));
                    legendMimeType = wmsLegendUrl.Format;
                }

                const legendUrl = !legendUri ? undefined : {
                    url: legendUri.toString(),
                    mimeType: legendMimeType
                };

                return {
                    name: style.Name,
                    title: style.Title,
                    abstract: style.Abstract,
                    legendUrl: legendUrl
                };
            });
        }

        return result;
    }

    // @computed
    // get info(): InfoSection[] {
    //     // if (!containsAny(thisLayer.Abstract, WebMapServiceCatalogItem.abstractsToIgnore)) {
    //     //     updateInfoSection(wmsItem, overwrite, 'Data Description', thisLayer.Abstract);
    //     // }
    //     return [];
    // }

    @computed
    get isGeoServer(): boolean {
        if (!this.capabilities) {
            return false;
        }

        if (!this.capabilities.Service ||
            !this.capabilities.Service.KeywordList ||
            !this.capabilities.Service.KeywordList.Keyword)
        {
            return false;
        }

        const keyword = this.capabilities.Service.KeywordList.Keyword;
        if (isReadOnlyArray(keyword)) {
            return keyword.indexOf('GEOSERVER') >= 0;
        } else {
            return keyword === 'GEOSERVER';
        }
    }

    @observable intervals: any;
}

class WebMapServiceCatalogItem extends GetCapabilitiesMixin(UrlMixin(CatalogMemberMixin(Model(WebMapServiceCatalogItemTraits)))) implements Mappable {
    get type() {
        return 'wms';
    }

    constructor(id: string, terria: Terria) {
        super(id, terria);
        this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, new GetCapabilitiesStratum(this));
    }

    @computed
    get layersArray(): ReadonlyArray<string> {
        if (Array.isArray(this.layers)) {
            return this.layers;
        } else if (this.layers) {
            return this.layers.split(',');
        } else {
            return [];
        }
    }

    protected get defaultGetCapabilitiesUrl(): string | undefined {
        if (this.uri) {
            return this.uri.clone().setSearch({
                service: 'WMS',
                version: '1.3.0',
                request: 'GetCapabilities'
            }).toString();
        } else {
            return undefined;
        }
    }

    @computed
    get currentDiscreteTime(): string | undefined {
        return undefined; // TODO
    }

    @computed
    get nextDiscreteTime(): string | undefined {
        return undefined; // TODO
    }

    @computed
    get mapItems() {
        trace();
        const result = [];

        const current = this._currentImageryLayer;
        if (current) {
            result.push(current);
        }

        const next = this._nextImageryLayer;
        if (next) {
            result.push(next);
        }

        return result;


        // .filter(item => item !== undefined);
    }

    @computed
    @autoUpdate(function(this: WebMapServiceCatalogItem, layer: ImageryLayer) {
        layer.alpha = this.opacity || 0.8;
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

    private _createImageryLayer(time: string | undefined): ImageryLayer | undefined {
        // Don't show anything on the map until GetCapabilities finishes loading.
        // But do trigger loading so that we can eventually show something!
        // TODO should this be a more general loading check? eliminate the cast?
        const stratum = <GetCapabilitiesStratum>this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName);
        stratum.loadIfNeeded();
        if (stratum.isLoading) {
            return undefined;
        }

        return {
            wms: true,
            isGeoServer: this.isGeoServer || false,
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
}

export default WebMapServiceCatalogItem;

// class Cesium {
//     scene: any;

//     constructor(terria) {
//         autorun(() => {
//             terria.nowViewing.items.forEach(workbenchItem => {
//                 const mapItems = workbenchItem.mapItems;
//                 if (!mapItems) {
//                     return;
//                 }

//                 mapItems.forEach(mapItem => {
//                     // TODO: Look up the type in a map and call the associated function.
//                     //       That way the supported types of map items is extensible.
//                     if (mapItem instanceof ImageryLayer) {
//                         this.scene.imageryLayers.add(mapItem);
//                     } else if (mapItem instanceof DataSource) {
//                         this.scene.dataSources.add(mapItem);
//                     }
//                 });
//             });
//         });
//     }
// }
