import { observable, runInAction } from "mobx";
import JsonValue, { isJsonObject, JsonObject } from "../Core/Json";
import loadJson from "../Core/loadJson";
import makeRealPromise from "../Core/makeRealPromise";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import MagdaCatalogItemTraits from "../Traits/MagdaCatalogItemTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";

export default class MagdaCatalogItem extends ReferenceMixin(UrlMixin(CatalogMemberMixin(CreateModel(MagdaCatalogItemTraits)))) {
    static readonly type = 'magda';

    @observable
    private _reference: BaseModel | undefined;

    get type() {
        return MagdaCatalogItem.type;
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
                        return [distributionJson];
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
            runInAction(() => {
                const item = new WebMapServiceCatalogItem(this.id + '/test', this.terria);
                item.setTrait(CommonStrata.inheritedFromParentGroup, 'info', [{
                    name: 'Test',
                    content: distributionsToConsider.length.toString()
                }]);
                item.setTrait(CommonStrata.definition, 'url', 'https://programs.communications.gov.au/geoserver/ows');
                item.setTrait(CommonStrata.definition, 'layers', 'mybroadband:MyBroadband_ADSL_Availability');
                this._reference = item;
            });
            // var catalogItemCreatingAttempts = [];
            // for (let i = 0; i < distributionsToConsider.length; ++i) {
            //     const attempt = MagdaCatalogItem.createCatalogItemFromDistribution({
            //         terria: this.terria,
            //         distribution: distributionsToConsider[i],
            //         magdaBaseUrl: this.url,
            //         wmsDistributionFormat: this.allowWms
            //             ? this.wmsDistributionFormat
            //             : undefined,
            //         // kmlDistributionFormat: that.allowKml
            //         //     ? that.kmlDistributionFormat
            //         //     : undefined,
            //         // wfsDistributionFormat: that.allowWfs
            //         //     ? that.wfsDistributionFormat
            //         //     : undefined,
            //         // csvDistributionFormat: that.allowCsv
            //         //     ? that.csvDistributionFormat
            //         //     : undefined,
            //         // esriMapServerDistributionFormat: that.allowEsriMapServer
            //         //     ? that.esriMapServerDistributionFormat
            //         //     : undefined,
            //         // geoJsonDistributionFormat: that.allowGeoJson
            //         //     ? that.geoJsonDistributionFormat
            //         //     : undefined,
            //         // czmlDistributionFormat: that.allowCzml
            //         //     ? that.czmlDistributionFormat
            //         //     : undefined,
            //         // dataCustodian: this.dataCustodian,
            //         // itemProperties: this.itemProperties,
            //         // allowWfsGroups: true,
            //         // allowWmsGroups: true,
            //         // zoomOnEnable: that.zoomOnEnable
            //     }).then(catalogItem => {
            //         if (!defined(catalogItem)) {
            //             var e =new Error();
            //             e.ignore = true;
            //             throw e;
            //             //--- creation function may return undefined.
            //             //--- This should be considered as failed but not report to user.
            //         }else {
            //             catalogItem.name = this.name;
            //             return catalogItem;
            //         }
            //     });
            //     catalogItemCreatingAttempts.push(attempt);
            // }
        });
    }

    // static createCatalogItemFromDistribution(options: {
    //     distribution: JsonObject,
    //     parent: JsonObject
    // }) {
    //     var distribution = options.distribution;
    //     var parent = options.parent;

    //     var formats = [
    //         // Format Regex, Catalog Item, (optional) URL regex
    //         [options.wmsDistributionFormat, WebMapServiceCatalogItem],
    //         [options.wfsDistributionFormat, WebFeatureServiceCatalogItem],
    //         [
    //             options.esriMapServerDistributionFormat,
    //             ArcGisMapServerCatalogItem,
    //             /MapServer/
    //         ],
    //         [
    //             options.esriFeatureServerDistributionFormat,
    //             ArcGisFeatureServerCatalogItem,
    //             /FeatureServer/
    //         ],
    //         [options.kmlDistributionFormat, KmlCatalogItem],
    //         [options.geoJsonDistributionFormat, GeoJsonCatalogItem],
    //         [options.czmlDistributionFormat, CzmlCatalogItem],
    //         [options.csvDistributionFormat, CsvCatalogItem]
    //     ].filter(function(format) {
    //         return defined(format[0]);
    //     });

    //     var dcatJson = distribution.aspects["dcat-distribution-strings"];
    //     var datasetFormat = distribution.aspects["dataset-format"];
    //     let formatString = dcatJson.format;
    //     if (datasetFormat && datasetFormat.format) {
    //         formatString = datasetFormat.format;
    //     }

    //     var baseUrl = dcatJson.downloadURL;
    //     if (!defined(baseUrl)) {
    //         if (dcatJson.accessURL) {
    //             baseUrl = dcatJson.accessURL;
    //         } else {
    //             return when(undefined);
    //         }
    //     }

    //     var matchingFormats = formats.filter(function(format) {
    //         // Matching formats must match the format regex,
    //         // and also the URL regex if it exists.
    //         return (
    //             formatString.match(format[0]) &&
    //             (!defined(format[2]) || baseUrl.match(format[2]))
    //         );
    //     });
    //     if (matchingFormats.length === 0) {
    //         return when(undefined);
    //     }

    //     var isWms = matchingFormats[0][1] === WebMapServiceCatalogItem;
    //     var isWfs = matchingFormats[0][1] === WebFeatureServiceCatalogItem;

    //     // Extract the layer name from the URL.
    //     var uri = new URI(baseUrl);
    //     var params = uri.search(true);

    //     // Remove the query portion of the WMS URL.
    //     var url = baseUrl;

    //     var newItem;
    //     if (isWms || isWfs) {
    //         uri.search("");
    //         url = uri.toString();
    //         var layerName = params.LAYERS || params.layers || params.typeName;
    //         if (defined(layerName)) {
    //             newItem = isWms
    //                 ? new WebMapServiceCatalogItem(options.terria)
    //                 : new WebFeatureServiceCatalogItem(options.terria);
    //             newItem.layers = layerName;
    //             newItem.url = url;
    //         } else {
    //             // Construct a WMS/WFS CatalogGroup and return the first item
    //             var newGroup;
    //             if (isWms && options.allowWmsGroups) {
    //                 newGroup = new WebMapServiceCatalogGroup(options.terria);
    //                 newGroup.flatten = true;
    //             } else if (isWfs && options.allowWfsGroups) {
    //                 newGroup = new WebFeatureServiceCatalogGroup(options.terria);
    //             } else {
    //                 return when(undefined);
    //             }
    //             newGroup.url = url;
    //             newItem = newGroup.load().then(function() {
    //                 if (newGroup.items.length === 0) {
    //                     return undefined;
    //                 } else {
    //                     return newGroup.items[0];
    //                 }
    //             });
    //         }
    //     } else {
    //         newItem = new matchingFormats[0][1](options.terria);
    //         newItem.url = url;
    //     }
    //     return when(newItem).then(function(newItem) {
    //         if (!newItem) {
    //             return undefined;
    //         }

    //         newItem.name = dcatJson.title;

    //         newItem.info.push({
    //             name: "Distribution Description",
    //             content: dcatJson.description
    //         });

    //         // newItem.dataUrl = new URI(options.ckanBaseUrl).segment('dataset').segment(itemData.name).toString();
    //         // newItem.dataUrlType = 'direct';

    //         if (defined(options.dataCustodian)) {
    //             newItem.dataCustodian = options.dataCustodian;
    //         }

    //         if (typeof options.itemProperties === "object") {
    //             newItem.updateFromJson(options.itemProperties);
    //         }

    //         if (defined(parent)) {
    //             newItem.id = parent.uniqueId + "/" + distribution.id;
    //         }

    //         if (defined(options.zoomOnEnable)) {
    //             newItem.zoomOnEnable = options.zoomOnEnable;
    //         }

    //         knockout.getObservable(newItem, "isLoading").subscribe(function(value) {
    //             try {
    //                 if (value === true) return;
    //                 if (window.parent !== window) {
    //                     window.parent.postMessage("loading complete", "*");
    //                 }

    //                 if (window.opener) {
    //                     window.opener.postMessage("loading complete", "*");
    //                 }
    //             } catch (e) {
    //                 console.log(e);
    //             }
    //         });

    //         return newItem;
    //     });

    // }
}
