import { computed, observable } from "mobx";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import JsonValue, { isJsonObject, JsonArray } from "../Core/Json";
import loadJson from "../Core/loadJson";
import makeRealPromise from "../Core/makeRealPromise";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import MagdaCatalogItemTraits, { MagdaDistributionFormatTraits } from "../Traits/MagdaCatalogItemTraits";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import Terria from "./Terria";
import upsertModelFromJson from "./upsertModelFromJson";

const defaultDistributionFormats = [
    createStratumInstance(MagdaDistributionFormatTraits, {
        id: 'WMS',
        formatRegex: '^wms$',
        terriaDefinition: {
            type: 'wms'
        }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
        id: 'EsriMapServer',
        formatRegex: '^esri rest$',
        urlRegex: 'MapServer',
        terriaDefinition: {
            type: 'esri-mapServer'
        }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
        id: 'CSV',
        formatRegex: '^csv(-geo-)?',
        terriaDefinition: {
            type: 'csv'
        }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
        id: 'CZML',
        formatRegex: '^czml$',
        terriaDefinition: {
            type: 'czml'
        }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
        id: 'KML',
        formatRegex: '^km[lz]$',
        terriaDefinition: {
            type: 'kml'
        }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
        id: 'GeoJSON',
        formatRegex: '^geojson$',
        terriaDefinition: {
            type: 'geojson'
        }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
        id: 'WFS',
        formatRegex: '^wfs$',
        terriaDefinition: {
            type: 'wfs'
        }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
        id: 'EsriFeatureServer',
        formatRegex: '^esri rest$',
        urlRegex: 'FeatureServer',
        terriaDefinition: {
            type: 'esri-featureServer'
        }
    })
];

export default class MagdaCatalogItem extends ReferenceMixin(UrlMixin(CatalogMemberMixin(CreateModel(MagdaCatalogItemTraits)))) {
    static readonly type = 'magda';

    @observable
    private _reference: BaseModel | undefined;

    get type() {
        return MagdaCatalogItem.type;
    }

    constructor(id: string, terria: Terria) {
        super(id, terria);

        this.setTrait(CommonStrata.defaults, 'distributionFormats', defaultDistributionFormats);
    }

    get dereferenced(): BaseModel | undefined {
        return this._reference;
    }

    protected get loadMetadataPromise(): Promise<void> {
        return this.loadReference();
    }

    protected get loadReferencePromise(): Promise<void> {
        return Promise.resolve().then(() => {
            if (this.uri === undefined) {
                throw new TerriaError({
                    sender: this,
                    title: 'url must be specified',
                    message: 'MagdaCatalogItem requires that `url` be specified.'
                });
            }

            const baseUri = this.uri.segment('api/v0/registry');
            if (this.distributionId !== undefined) {
                const distributionUri = baseUri
                    .clone()
                    .segment(`records/${encodeURIComponent(this.distributionId)}`)
                    .addQuery({
                        aspect: 'dcat-distribution-strings',
                        optionlAspect: 'dataset-format'
                    });
                const proxiedUrl = proxyCatalogItemUrl(this, distributionUri.toString(), '1d');
                return makeRealPromise<JsonValue>(loadJson(proxiedUrl)).then(distributionJson => {
                    if (isJsonObject(distributionJson) && distributionJson.id !== undefined) {
                        return <JsonArray>[distributionJson];
                    } else {
                        return [];
                    }
                });
            } else if (this.datasetId !== undefined) {
                const datasetUri = baseUri
                    .clone()
                    .segment(`records/${encodeURIComponent(this.datasetId)}`)
                    .addQuery({
                        aspect: 'dataset-distributions',
                        optionalAspect: 'dataset-format',
                        dereference: true
                    });
                const proxiedUrl = proxyCatalogItemUrl(this, datasetUri.toString(), '1d');
                return makeRealPromise<JsonValue>(loadJson(proxiedUrl)).then(datasetJson => {
                    if (!isJsonObject(datasetJson)) {
                        return [];
                    }

                    const aspects = datasetJson.aspects;
                    if (!isJsonObject(aspects)) {
                        return [];
                    }

                    const distributionsAspect = aspects['dataset-distributions'];
                    if (!isJsonObject(distributionsAspect)) {
                        return [];
                    }

                    const distributions = distributionsAspect.distributions;
                    if (!Array.isArray(distributions)) {
                        return [];
                    }

                    return distributions;
                });
            } else {
                throw new TerriaError({
                    sender: this,
                    title: 'distributionId or datasetId must be specified',
                    message: 'MagdaCatalogItem requires that either `distributionId` or `datasetId` be specified.'
                });
            }
        }).then(distributionsToConsider => {
            return this.createCatalogItemFromDistributions(distributionsToConsider);
        }).then(catalogItem => {
            this._reference = catalogItem;
        });
    }

    async createCatalogItemFromDistributions(distributions: JsonArray): Promise<BaseModel | undefined> {
        const distributionFormats = this.distributionFormats || [];
        const formatRegexs = distributionFormats.map(distributionFormat => {
            if (distributionFormat.formatRegex !== undefined) {
                return new RegExp(distributionFormat.formatRegex, 'i');
            }
        });
        const urlRegexs = distributionFormats.map(distributionFormat => {
            if (distributionFormat.urlRegex !== undefined) {
                return new RegExp(distributionFormat.urlRegex, 'i');
            }
        });

        class InheritedStratum {
            constructor(readonly magda: MagdaCatalogItem, readonly url: string) {
            }

            @computed
            get name() {
                return this.magda.name;
            }

            @computed
            get info() {
                return this.magda.info;
            }
        }

        for (let i = 0; i < distributionFormats.length; ++i) {
            const distributionFormat = distributionFormats[i];
            const formatRegex = formatRegexs[i];
            const urlRegex = urlRegexs[i];

            // Find distributions that match this format
            for (let j = 0; j < distributions.length; ++j) {
                const distribution = distributions[j];

                if (!isJsonObject(distribution)) {
                    continue;
                }

                const aspects = distribution.aspects;
                if (!isJsonObject(aspects)) {
                    continue;
                }

                const dcatJson = aspects['dcat-distribution-strings'];
                const datasetFormat = aspects['dataset-format'];

                let format: string | undefined;
                let url: string | undefined;

                if (isJsonObject(dcatJson)) {
                    if (typeof dcatJson.format === 'string') {
                        format = dcatJson.format;
                    }
                    if (typeof dcatJson.downloadURL === 'string') {
                        url = dcatJson.downloadURL;
                    }

                    if (url === undefined && typeof dcatJson.accessURL === 'string') {
                        url = dcatJson.accessURL;
                    }
                }

                if (isJsonObject(datasetFormat) && typeof datasetFormat.format === 'string')  {
                    format = datasetFormat.format;
                }

                if (format === undefined || url === undefined) {
                    continue;
                }

                const formatRegex = formatRegexs[i];
                const urlRegex = urlRegexs[i];
                if (formatRegex !== undefined && !formatRegex.test(format) || urlRegex !== undefined && !urlRegex.test(url)) {
                    continue;
                }

                const definition = Object.assign({}, distributionFormat.terriaDefinition);
                definition.localId = createGuid();

                try {
                    const catalogMember = upsertModelFromJson(CatalogMemberFactory, this.terria, this.id, undefined, CommonStrata.definition, definition);
                    catalogMember.strata.set(CommonStrata.inheritedFromParentGroup, new InheritedStratum(this, url));
                    if (CatalogMemberMixin.isMixedInto(catalogMember)) {
                        await catalogMember.loadMetadata();
                    }
                    return catalogMember;
                } catch (e) {
                    continue;
                }
            }
        }

        return undefined;
    }
}
