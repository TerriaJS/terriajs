// const mobx = require('mobx');
// const mobxUtils = require('mobx-utils');
// Problems in current architecture:
// 1. After loading, can't tell what user actually set versus what came from e.g. GetCapabilities.
//  Solution: layering
// 2. CkanCatalogItem producing a WebMapServiceCatalogItem on load
// 3. Observable spaghetti
//  Solution: think in terms of pipelines with computed observables, document patterns.
// 4. All code for all catalog item types needs to be loaded before we can do anything.
import { autorun, computed, observable, trace } from 'mobx';
import * as URI from 'urijs';
import autoUpdate from '../Core/autoUpdate';
import isReadOnlyArray from '../Core/isReadOnlyArray';
import WebMapServiceCatalogItemDefinition from '../Definitions/WebMapServiceCatalogItemDefinition';
import CatalogMember from './CatalogMemberNew';
import Model from './Model';
import WebMapServiceCapabilities, { CapabilitiesLayer } from './WebMapServiceCapabilities';
import defineLoadableStratum from './defineLoadableStratum';
import defineStratum from './defineStratum';
import * as proxyCatalogItemUrl from './proxyCatalogItemUrl';
import Mappable from './Mappable';

interface LegendUrl {
    url: string;
    mimeType: string;
}

interface WebMapServiceStyle {
    name: string;
    title: string;
    abstract: string;
    legendUrl: LegendUrl;
}

interface WebMapServiceStyles {
    [layerName: string]: WebMapServiceStyle[];
}

class GetCapabilitiesValue {
    catalogItem: WebMapServiceCatalogItem;

    @observable
    capabilities: WebMapServiceCapabilities;

    @computed
    get capabilitiesLayers(): ReadonlyMap<string, CapabilitiesLayer> {
        const lookup: (name: string) => [string, CapabilitiesLayer] = name => [name, this.capabilities.findLayer(name)];
        return new Map(this.catalogItem.layersArray.map(lookup));
    }

    @computed
    get availableStyles(): WebMapServiceStyles {
        const result: WebMapServiceStyles = {};

        const capabilitiesLayers = this.capabilitiesLayers;

        for (const layerTuple of capabilitiesLayers) {
            const layerName = layerTuple[0];
            const layer = layerTuple[1];

            result[layerName] = this.capabilities.getInheritedValues(layer, 'Style').map(style => {
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

const GetCapabilitiesStratum = defineLoadableStratum(WebMapServiceCatalogItemDefinition, GetCapabilitiesValue, 'isGeoServer', 'intervals', 'availableStyles');
const FullStratum = defineStratum(WebMapServiceCatalogItemDefinition);

interface WebMapServiceCatalogItem extends Model.InterfaceFromDefinition<WebMapServiceCatalogItemDefinition> {}

@Model.definition(WebMapServiceCatalogItemDefinition)
class WebMapServiceCatalogItem extends CatalogMember implements Mappable {
    get type() {
        return 'wms';
    }

    readonly flattened: Model.InterfaceFromDefinition<WebMapServiceCatalogItemDefinition>;

    @observable modelStrata = ['getCapabilitiesStratum', /*'describeLayerLayer',*/ 'definitionStratum', 'userStratum'];
    @observable defaultStratumToModify = 'userStratum';

    readonly getCapabilitiesStratum  = new GetCapabilitiesStratum(layer => this._loadGetCapabilitiesStratum(layer));
    readonly definitionStratum = new FullStratum();
    readonly userStratum = new FullStratum();

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

    @computed
    get getCapabilitiesUrl(): string {
        const getCapabilitiesUrl = this.flattened.getCapabilitiesUrl;
        if (getCapabilitiesUrl) {
            return getCapabilitiesUrl;
        } else if (this.uri) {
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
        values.catalogItem = this;

        // How do we avoid loading GetCapabilities if it's already been loaded?
        // For example, if this catalog item was created by a group, we don't want
        // to load the same GetCapabilities for every item in the group.
        // Maybe extract GetCapabilities loading and parsing into a pipeline
        // of createTransformer functions.
        // e.g. one function takes a URL and returns a representation object of
        // GetCapabilities. A function on that object takes a layer name
        // and returns the details for that layer.

        const proxiedUrl = proxyCatalogItemUrl(this, this.getCapabilitiesUrl, this.getCapabilitiesCacheDuration);
        return WebMapServiceCapabilities.fromUrl(proxiedUrl).then(capabilities => {
            values.capabilities = capabilities;
        });

        // console.log('fetching ' + this.getCapabilitiesUrl);
        // const url = this.getCapabilitiesUrl;
        // return fetch(url).then(response => {
        //     console.log('fetched ' + url);
        //     //const xml = response.xml();
        //     //const capabilities = xml; // TODO
        //     const capabilities = {
        //         Service: {
        //             KeywordList: {
        //                 Keyword: ['GEOSERVER']
        //             }
        //         }
        //     };

        //     runInAction(() => {
        //         values.isGeoServer =
        //             defined(capabilities) &&
        //             defined(capabilities.Service) &&
        //             defined(capabilities.Service.KeywordList) &&
        //             defined(capabilities.Service.KeywordList.Keyword) &&
        //             capabilities.Service.KeywordList.Keyword.indexOf('GEOSERVER') >= 0;
        //     });

        //     return values;
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
