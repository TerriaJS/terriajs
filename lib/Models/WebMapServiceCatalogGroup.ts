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

    @observable
    isLoading: boolean = false;

    @observable
    members: ModelReference[] | undefined;

    @action
    createMembers() {
        const layers = this.catalogGroup.flatten
            ? this.capabilities.allLayers
            : this.getTopLevelLayers(this.capabilities.rootLayers);

        const id = this.catalogGroup.id;

        // Create a model for each Layer at this level.
        const members: ModelReference[] = [];
        layers.forEach(layer => {
            if (!layer.Name) {
                return;
            }

            const layerId = id + "/" + encodeURIComponent(layer.Name);
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


            const stratum = CommonStrata.inheritedFromParentGroup;
            model.setTrait(stratum, 'name', layer.Title);
            model.setTrait(stratum, 'url', this.catalogGroup.url);
            model.setTrait(stratum, 'getCapabilitiesUrl', this.catalogGroup.getCapabilitiesUrl);
            model.setTrait(stratum, 'getCapabilitiesCacheDuration', this.catalogGroup.getCapabilitiesCacheDuration);
            model.setTrait(stratum, 'layers', layer.Name);

            members.push(layerId);
        });

        this.members = members;
    }

    private getTopLevelLayers(
        rootLayers: CapabilitiesLayer[]
    ): ReadonlyArray<CapabilitiesLayer> {
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

export default class WebMapServiceCatalogGroup extends GetCapabilitiesMixin(UrlMixin(GroupMixin(CatalogMemberMixin(CreateModel(WebMapServiceCatalogGroupTraits))))) {
    static readonly type = 'wms-group';

    get type() {
        return WebMapServiceCatalogGroup.type;
    }

    constructor(id: string, terria: Terria) {
        super(id, terria);
    }

    get loadMetadataPromise(): Promise<void> {
        return GetCapabilitiesStratum.load(this).then(stratum => {
            this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
        });
    }

    loadMembers(): Promise<void> {
        return this.loadMetadataPromise.then(() => {
            const getCapabilitiesStratum: GetCapabilitiesStratum = <GetCapabilitiesStratum>this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName);
            return getCapabilitiesStratum.createMembers();
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
