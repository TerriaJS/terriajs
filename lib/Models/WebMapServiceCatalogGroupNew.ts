import { computed, observable, runInAction } from 'mobx';
import WebMapServiceCatalogGroupDefinition from '../Definitions/WebMapServiceCatalogGroupDefinition';
import CatalogGroup from './CatalogGroupNew';
import Model from './Model';
import WebMapServiceCapabilities, { CapabilitiesLayer } from './WebMapServiceCapabilities';
import defineLoadableStratum from './defineLoadableStratum';
import defineStratum from './defineStratum';
import * as proxyCatalogItemUrl from './proxyCatalogItemUrl';
import WebMapServiceCatalogItem from './WebMapServiceCatalogItem3';
import ModelReference from '../Definitions/ModelReference';
import isReadOnlyArray from '../Core/isReadOnlyArray';
import CatalogMember from './CatalogMemberNew';

class GetCapabilitiesValue {
    catalogGroup: WebMapServiceCatalogGroup;

    @observable
    capabilities: WebMapServiceCapabilities;

    @computed
    get members(): ModelReference[] {
        if (!this.capabilities) {
            return [];
        }

        const layers = this.catalogGroup.flatten ? this.capabilities.allLayers : this.getTopLevelLayers(this.capabilities.rootLayers);

        const id = this.catalogGroup.id;

        // Create a model for each Layer at this level.
        const result = [];
        layers.forEach(layer => {
            if (!layer.Name) {
                return;
            }

            const layerId = id + '/' + encodeURIComponent(layer.Name);
            let model = this.catalogGroup.terria.getModelById(WebMapServiceCatalogItem, layerId);
            if (!model) {
                model = new WebMapServiceCatalogItem(this.catalogGroup.terria);
                model.definitionStratum.id = layerId;
                this.catalogGroup.terria.addModel(layerId, model);
            }

            // TODO: Should this be a "parentStratum" or "inheritedStratum" or something instead?
            model.definitionStratum.url = this.catalogGroup.url;
            model.definitionStratum.getCapabilitiesUrl = this.catalogGroup.getCapabilitiesUrl;
            model.definitionStratum.getCapabilitiesCacheDuration = this.catalogGroup.getCapabilitiesCacheDuration;
            model.definitionStratum.layers = layer.Name;

            result.push(layerId);
        });

        return result;
    }

    private getTopLevelLayers(rootLayers: CapabilitiesLayer[]): ReadonlyArray<CapabilitiesLayer> {
        if (rootLayers.length === 1) {
            const subLayers = rootLayers[0].Layer;
            return isReadOnlyArray(subLayers) ? subLayers : [subLayers];
        } else {
            return rootLayers;
        }
    }
}

const GetCapabilitiesStratum = defineLoadableStratum(WebMapServiceCatalogGroupDefinition, GetCapabilitiesValue, 'members');
const FullStratum = defineStratum(WebMapServiceCatalogGroupDefinition);

export default interface WebMapServiceCatalogGroup extends Model.InterfaceFromDefinition<WebMapServiceCatalogGroupDefinition> {}

@Model.definition(WebMapServiceCatalogGroupDefinition)
export default class WebMapServiceCatalogGroup extends CatalogGroup { // TODO: avoid concrete inheritance?
    get type() {
        return 'wms-group';
    }

    readonly flattened: Model.InterfaceFromDefinition<WebMapServiceCatalogGroupDefinition>;

    @observable modelStrata = ['getCapabilitiesStratum', 'definitionStratum', 'userStratum'];

    readonly getCapabilitiesStratum  = new GetCapabilitiesStratum(layer => this._loadGetCapabilitiesStratum(layer));
    readonly definitionStratum = new FullStratum();
    readonly userStratum = new FullStratum();

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

    private _loadGetCapabilitiesStratum(values: typeof GetCapabilitiesStratum.TLoadValue): Promise<void> {
        values.catalogGroup = this;

        const proxiedUrl = proxyCatalogItemUrl(this, this.getCapabilitiesUrl, this.getCapabilitiesCacheDuration);
        return WebMapServiceCapabilities.fromUrl(proxiedUrl).then(capabilities => {
            runInAction(() => {
                values.capabilities = capabilities;
            });
        });
    }
}
