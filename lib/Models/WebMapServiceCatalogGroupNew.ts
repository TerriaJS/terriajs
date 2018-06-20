import { computed, observable, runInAction } from 'mobx';
import LoadableStratum from '../../test/Models/LoadableStratum';
import isReadOnlyArray from '../Core/isReadOnlyArray';
import * as TerriaError from '../Core/TerriaError';
import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GetCapabilitiesMixin from '../ModelMixins/GetCapabilitiesMixin';
import GroupMixin from '../ModelMixins/GroupMixin';
import UrlMixin from '../ModelMixins/UrlMixin';
import ModelReference from '../Traits/ModelReference';
import WebMapServiceCatalogGroupTraits from '../Traits/WebMapServiceCatalogGroupTraits';
import CommonStrata from './CommonStrata';
import Model from './Model';
import * as proxyCatalogItemUrl from './proxyCatalogItemUrl';
import Terria from './TerriaNew';
import WebMapServiceCapabilities, { CapabilitiesLayer } from './WebMapServiceCapabilities';
import WebMapServiceCatalogItem from './WebMapServiceCatalogItem3';

class GetCapabilitiesStratum extends LoadableStratum implements WebMapServiceCatalogGroupTraits {
    constructor(readonly catalogGroup: WebMapServiceCatalogGroup) {
        super();
    }

    @observable
    private _capabilities: WebMapServiceCapabilities | undefined;

    load(): Promise<void> {
        this._capabilities = undefined;

        if (this.catalogGroup.getCapabilitiesUrl === undefined) {
            return Promise.reject(new TerriaError({
                title: 'Unable to load GetCapabilities',
                message: 'Could not load the Web Map Service (WMS) GetCapabilities document because the catalog item does not have a `url`.'
            }));
        }

        const proxiedUrl = proxyCatalogItemUrl(this.catalogGroup, this.catalogGroup.getCapabilitiesUrl, this.catalogGroup.getCapabilitiesCacheDuration);
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
    get members(): ModelReference[] | undefined {
        if (!this.capabilities) {
            return undefined;
        }

        const layers = this.catalogGroup.flatten ? this.capabilities.allLayers : this.getTopLevelLayers(this.capabilities.rootLayers);

        const id = this.catalogGroup.id;

        // Create a model for each Layer at this level.
        const result: ModelReference[] = [];
        layers.forEach(layer => {
            if (!layer.Name) {
                return;
            }

            const layerId = id + '/' + encodeURIComponent(layer.Name);
            let model = this.catalogGroup.terria.getModelById(WebMapServiceCatalogItem, layerId);
            if (!model) {
                model = new WebMapServiceCatalogItem(layerId, this.catalogGroup.terria);
                const stratum = model.addStratum(CommonStrata.inheritedFromParentGroup);
                this.catalogGroup.terria.addModel(model);
            }

            // TODO: Should this be a "parentStratum" or "inheritedStratum" or something instead?
            const stratum = model.addStratum(CommonStrata.inheritedFromParentGroup);
            stratum.url = this.catalogGroup.url;
            stratum.getCapabilitiesUrl = this.catalogGroup.getCapabilitiesUrl;
            stratum.getCapabilitiesCacheDuration = this.catalogGroup.getCapabilitiesCacheDuration;
            stratum.layers = layer.Name;

            result.push(layerId);
        });

        return result;
    }

    private getTopLevelLayers(rootLayers: CapabilitiesLayer[]): ReadonlyArray<CapabilitiesLayer> {
        if (rootLayers.length === 1) {
            const subLayers = rootLayers[0].Layer;
            if (subLayers === undefined) {
                return [];
            }
            return isReadOnlyArray(subLayers) ? subLayers : [subLayers];
        } else {
            return rootLayers;
        }
    }
}

export default class WebMapServiceCatalogGroup extends GetCapabilitiesMixin(GroupMixin(CatalogMemberMixin(UrlMixin(Model(WebMapServiceCatalogGroupTraits))))) {
    get type() {
        return 'wms-group';
    }

    constructor(id: string, terria: Terria) {
        super(id, terria);
        this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, new GetCapabilitiesStratum(this));
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
}
