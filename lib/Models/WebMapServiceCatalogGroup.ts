import { computed, observable, runInAction, trace, action } from 'mobx';
import LoadableStratum from './LoadableStratum';
import isReadOnlyArray from '../Core/isReadOnlyArray';
import TerriaError from '../Core/TerriaError';
import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GetCapabilitiesMixin from '../ModelMixins/GetCapabilitiesMixin';
import GroupMixin from '../ModelMixins/GroupMixin';
import UrlMixin from '../ModelMixins/UrlMixin';
import ModelReference from '../Traits/ModelReference';
import WebMapServiceCatalogGroupTraits from '../Traits/WebMapServiceCatalogGroupTraits';
import CommonStrata from './CommonStrata';
import CreateModel from './CreateModel';
import proxyCatalogItemUrl from './proxyCatalogItemUrl';
import Terria from './Terria';
import WebMapServiceCapabilities, { CapabilitiesLayer } from './WebMapServiceCapabilities';
import WebMapServiceCatalogItem from './WebMapServiceCatalogItem';
import filterOutUndefined from '../Core/filterOutUndefined';

class GetCapabilitiesStratum extends LoadableStratum(WebMapServiceCatalogGroupTraits) {
    static load(catalogItem: WebMapServiceCatalogGroup): Promise<GetCapabilitiesStratum> {
        if (catalogItem.getCapabilitiesUrl === undefined) {
            return Promise.reject(new TerriaError({
                title: 'Unable to load GetCapabilities',
                message: 'Could not load the Web Map Service (WMS) GetCapabilities document because the catalog item does not have a `url`.'
            }));
        }

        const proxiedUrl = proxyCatalogItemUrl(catalogItem, catalogItem.getCapabilitiesUrl, catalogItem.getCapabilitiesCacheDuration);
        return WebMapServiceCapabilities.fromUrl(proxiedUrl).then(capabilities => {
            return new GetCapabilitiesStratum(catalogItem, capabilities);
        });
    }

    constructor(readonly catalogGroup: WebMapServiceCatalogGroup, readonly capabilities: WebMapServiceCapabilities) {
        super();
    }

    @computed
    get members(): ModelReference[] {
        return filterOutUndefined(this.topLevelLayers.map(layer => {
            if (!layer.Name) {
                return undefined;
            }
            return this.catalogGroup.id + '/' + encodeURIComponent(layer.Name)
        }));
    }

    get topLevelLayers(): readonly CapabilitiesLayer[] {
        if (this.catalogGroup.flatten) {
            return this.capabilities.allLayers;
        } else {
            const rootLayers = this.capabilities.rootLayers;
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

    @action
    createMembersFromLayers() {
        this.topLevelLayers.forEach(layer => this.createMemberFromLayer(layer));
    }

    @action
    createMemberFromLayer(layer: CapabilitiesLayer) {
        if (!layer.Name) {
            return;
        }

        const id = this.catalogGroup.id;
        const layerId = id + '/' + encodeURIComponent(layer.Name);
        const existingModel = this.catalogGroup.terria.getModelById(
            WebMapServiceCatalogItem,
            layerId
        );

        let model: WebMapServiceCatalogItem;
        if (existingModel === undefined) {
            model = new WebMapServiceCatalogItem(
                layerId,
                this.catalogGroup.terria
            );
            this.catalogGroup.terria.addModel(model);
        } else {
            model = existingModel;
        }

        // Replace the stratum inherited from the parent group.
        const stratum = CommonStrata.inheritedFromParentGroup;

        model.strata.delete(stratum);

        model.setTrait(stratum, 'name', layer.Title);
        model.setTrait(stratum, 'url', this.catalogGroup.url);
        model.setTrait(stratum, 'getCapabilitiesUrl', this.catalogGroup.getCapabilitiesUrl);
        model.setTrait(stratum, 'getCapabilitiesCacheDuration', this.catalogGroup.getCapabilitiesCacheDuration);
        model.setTrait(stratum, 'layers', layer.Name);
    }
}

export default class WebMapServiceCatalogGroup extends GetCapabilitiesMixin(UrlMixin(GroupMixin(CatalogMemberMixin(CreateModel(WebMapServiceCatalogGroupTraits))))) {
    static readonly type = 'wms-group';

    get type() {
        return WebMapServiceCatalogGroup.type;
    }

    constructor(id: string, terria: Terria) {
        super(id, terria);
    }

    protected get loadMetadataPromise(): Promise<void> {
        return GetCapabilitiesStratum.load(this).then(stratum => {
            runInAction(() => {
                this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
            });
        });
    }

    protected get loadMembersPromise(): Promise<void> {
        return this.loadMetadata().then(() => {
            const getCapabilitiesStratum = <GetCapabilitiesStratum | undefined>this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName);
            if (getCapabilitiesStratum) {
                getCapabilitiesStratum.createMembersFromLayers();
            }
        });
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
