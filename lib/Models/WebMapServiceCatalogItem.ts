// const mobx = require('mobx');
// const mobxUtils = require('mobx-utils');
// Problems in current architecture:
// 1. After loading, can't tell what user actually set versus what came from e.g. GetCapabilities.
//  Solution: layering
// 2. CkanCatalogItem producing a WebMapServiceCatalogItem on load
// 3. Observable spaghetti
//  Solution: think in terms of pipelines with computed observables, document patterns.
// 4. All code for all catalog item types needs to be loaded before we can do anything.
import { computed, observable, trace, action, runInAction } from 'mobx';
import URI from 'urijs';
import LoadableStratum from '../../test/Models/LoadableStratum';
import autoUpdate from '../Core/autoUpdate';
import isReadOnlyArray from '../Core/isReadOnlyArray';
import TerriaError from '../Core/TerriaError';
import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GetCapabilitiesMixin from '../ModelMixins/GetCapabilitiesMixin';
import UrlMixin from '../ModelMixins/UrlMixin';
import WebMapServiceCatalogItemTraits from '../Traits/WebMapServiceCatalogItemTraits';
import Mappable, { ImageryLayer } from './Mappable';
import Model from './Model';
import proxyCatalogItemUrl from './proxyCatalogItemUrl';
import Terria from './TerriaNew';
import WebMapServiceCapabilities, { CapabilitiesLayer, CapabilitiesStyle } from './WebMapServiceCapabilities';
import { InfoSectionTraits } from '../Traits/mixCatalogMemberTraits';
import containsAny from '../Core/containsAny';

import WebMapServiceImageryProvider from 'terriajs-cesium/Source/Scene/WebMapServiceImageryProvider';
import CesiumImageryLayer from 'terriajs-cesium/Source/Scene/ImageryLayer';
import WebMercatorTilingScheme from 'terriajs-cesium/Source/Core/WebMercatorTilingScheme';



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


class GetCapabilitiesStratum implements WebMapServiceCatalogItemTraits {
    constructor(readonly catalogItem: WebMapServiceCatalogItem) { }

    @observable
    capabilities: WebMapServiceCapabilities | undefined;

    @observable
    isLoading: boolean = false;

    loadCapabilities(): Promise<void> {
        runInAction(() => {
            this.isLoading = true;
            this.capabilities = undefined;
        });

        if (this.catalogItem.getCapabilitiesUrl === undefined) {
            return Promise.reject(new TerriaError({
                title: 'Unable to load GetCapabilities',
                message: 'Could not load the Web Map Service (WMS) GetCapabilities document because the catalog item does not have a `url`.'
            }));
        }

        const proxiedUrl = proxyCatalogItemUrl(this.catalogItem, this.catalogItem.getCapabilitiesUrl, this.catalogItem.getCapabilitiesCacheDuration);
        return WebMapServiceCapabilities.fromUrl(proxiedUrl).then(capabilities => {
            runInAction(() => {
                this.capabilities = capabilities;
                this.isLoading = false;
            })
        });
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

    @computed
    get info(): InfoSectionTraits[] {
        const result: InfoSectionTraits[] = [];

        let firstDataDescription: string | undefined;
        for (const layer of this.capabilitiesLayers.values()) {
            if (!layer || !layer.Abstract || containsAny(layer.Abstract, WebMapServiceCatalogItem.abstractsToIgnore)) {
                continue;
            }

            const suffix = this.capabilitiesLayers.size === 1 ? '' : ` - ${layer.Title}`;
            const name = `Data Description${suffix}`;

            const traits = new InfoSectionTraits();
            traits.name = name;
            traits.content = layer.Abstract;
            result.push(traits);

            firstDataDescription = firstDataDescription || layer.Abstract;
        }

        // Show the service abstract if there is one and if it isn't the Geoserver default "A compliant implementation..."
        const service = this.capabilities && this.capabilities.Service;
        if (service) {
            if (service && service.Abstract && !containsAny(service.Abstract, WebMapServiceCatalogItem.abstractsToIgnore) && service.Abstract !== firstDataDescription) {
                const traits = new InfoSectionTraits();
                traits.name = 'Service Description';
                traits.content = service.Abstract;
                result.push(traits);
            }

            // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
            if (service.AccessConstraints && !/^none$/i.test(service.AccessConstraints)) {
                const traits = new InfoSectionTraits();
                traits.name = 'Access Constraints';
                traits.content = service.AccessConstraints;
                result.push(traits);
            }
        }

        return result;
    }

    @computed
    get isGeoServer(): boolean | undefined {
        if (!this.capabilities) {
            return undefined;
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
    /**
     * The collection of strings that indicate an Abstract property should be ignored.  If these strings occur anywhere
     * in the Abstract, the Abstract will not be used.  This makes it easy to filter out placeholder data like
     * Geoserver's "A compliant implementation of WMS..." stock abstract.
     */
    static abstractsToIgnore = [
        'A compliant implementation of WMS'
    ];

    static readonly type = 'wms';

    get type() {
        return WebMapServiceCatalogItem.type;
    }

    // TODO
    get isMappable() {
        return true;
    }

    constructor(id: string, terria: Terria) {
        super(id, terria);
        this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, new GetCapabilitiesStratum(this));
    }

    loadMetadata(): Promise<void> {
        const getCapabilitiesStratum: GetCapabilitiesStratum = <GetCapabilitiesStratum>this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName);
        return getCapabilitiesStratum.loadCapabilities();
    }

    loadData(): Promise<void> {
        return this.loadMetadata();
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
        // TODO should this be a more general loading check? eliminate the cast?
        const stratum = <GetCapabilitiesStratum>this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName);
        if (stratum.isLoading) {
            return undefined;
        }

        // return {
        //     wms: true,
        //     isGeoServer: this.isGeoServer || false,
        //     alpha: 1.0
        // };

        const imageryLayer = new CesiumImageryLayer(new WebMapServiceImageryProvider({
            url: this.url,
            layers: this.layers,
            // getFeatureInfoFormats: this.getFeatureInfoFormats,
            // parameters: parameters,
            // getFeatureInfoParameters: parameters,
            tilingScheme: /*defined(this.tilingScheme) ? this.tilingScheme :*/ new WebMercatorTilingScheme(),
            maximumLevel: 20 //maximumLevel
        }));

        return imageryLayer;
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
