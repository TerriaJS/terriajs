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
import Model from './Model';
import proxyCatalogItemUrl from './proxyCatalogItemUrl';
import Terria from './Terria';
import WebMapServiceCapabilities, { CapabilitiesLayer } from './WebMapServiceCapabilities';
import WebMapServiceCatalogItem from './WebMapServiceCatalogItem';

class GetCapabilitiesStratum extends LoadableStratum(WebMapServiceCatalogGroupTraits) {
    constructor(readonly catalogGroup: WebMapServiceCatalogGroup) {
        super();
    }

    @observable
    capabilities: WebMapServiceCapabilities | undefined;

    @observable
    isLoading: boolean = false;

    @observable
    members: ModelReference[] | undefined;

    @action
    loadCapabilities(): Promise<void> {
        this.isLoading = true;
        this.capabilities = undefined;

        if (this.catalogGroup.getCapabilitiesUrl === undefined) {
            return Promise.reject(
                new TerriaError({
                    title: "Unable to load GetCapabilities",
                    message:
                        "Could not load the Web Map Service (WMS) GetCapabilities document because the catalog item does not have a `url`."
                })
            );
        }

        const proxiedUrl = proxyCatalogItemUrl(
            this.catalogGroup,
            this.catalogGroup.getCapabilitiesUrl,
            this.catalogGroup.getCapabilitiesCacheDuration
        );
        return WebMapServiceCapabilities.fromUrl(proxiedUrl).then(capabilities => {
            runInAction(() => {
                this.capabilities = capabilities;
                this.isLoading = false;
            });
        });
    }

    createMembers(): Promise<void> {
        const p = this.capabilities ? Promise.resolve() : this.loadCapabilities();
        return p.then(() => {
            if (!this.capabilities) {
                throw Error("How? Also throwing this makes Typescript happy");
            }

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
                let model = this.catalogGroup.terria.getModelById(
                    WebMapServiceCatalogItem,
                    layerId
                );
                if (!model) {
                    model = new WebMapServiceCatalogItem(
                        layerId,
                        this.catalogGroup.terria
                    );
                    this.catalogGroup.terria.addModel(model);
                }

                const stratum = model.getOrCreateStratum(
                    CommonStrata.inheritedFromParentGroup
                );
                runInAction(() => {
                    stratum.name = layer.Title;
                    stratum.url = this.catalogGroup.url;
                    stratum.getCapabilitiesUrl = this.catalogGroup.getCapabilitiesUrl;
                    stratum.getCapabilitiesCacheDuration = this.catalogGroup.getCapabilitiesCacheDuration;
                    stratum.layers = layer.Name;
                })

                members.push(layerId);
            });

            runInAction(() => {this.members = members});
        });

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

export default class WebMapServiceCatalogGroup extends GetCapabilitiesMixin(UrlMixin(GroupMixin(CatalogMemberMixin(Model(WebMapServiceCatalogGroupTraits))))) {
    static readonly type = 'wms-group';

    get type() {
        return WebMapServiceCatalogGroup.type;
    }

    constructor(id: string, terria: Terria) {
        super(id, terria);
        this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, new GetCapabilitiesStratum(this));
    }

    loadMetadata(): Promise<void> {
        const getCapabilitiesStratum: GetCapabilitiesStratum = <GetCapabilitiesStratum>this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName);
        return getCapabilitiesStratum.loadCapabilities();
    }

    loadMembers(): Promise<void> {
        const getCapabilitiesStratum: GetCapabilitiesStratum = <GetCapabilitiesStratum>this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName);
        return getCapabilitiesStratum.createMembers();
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
