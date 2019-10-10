import { computed, toJS } from "mobx";
import { createTransformer } from "mobx-utils";
import {
  isJsonObject,
  JsonArray,
  JsonObject,
  isJsonString
} from "../Core/Json";
import loadJson from "../Core/loadJson";
import TerriaError from "../Core/TerriaError";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import anyTrait from "../Traits/anyTrait";
import CatalogGroupTraits from "../Traits/CatalogGroupTraits";
import MagdaDistributionFormatTraits from "../Traits/MagdaDistributionFormatTraits";
import mixTraits from "../Traits/mixTraits";
import NestedStrataMap from "../Traits/NestedStrataMap";
import objectArrayTrait from "../Traits/objectArrayTrait";
import primitiveTrait from "../Traits/primitiveTrait";
import traitsClassToModelClass from "../Traits/traitsClassToModelClass";
import UrlTraits from "../Traits/UrlTraits";
import CatalogGroup from "./CatalogGroupNew";
import createCombinedModel, { extractBottomModel } from "./createCombinedModel";
import CreateModel from "./CreateModel";
import Model, { BaseModel, ModelConstructor } from "./Model";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import updateModelFromJson from "./updateModelFromJson";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CommonStrata from "./CommonStrata";
import filterOutUndefined from "../Core/filterOutUndefined";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import ModelTraits from "../Traits/ModelTraits";
import Terria from "./Terria";
import StratumFromTraits from "./StratumFromTraits";

export interface RecordOptions {
  id: string | undefined;
  aspects?: string[];
  optionalAspects?: string[];
  dereference?: boolean;
}

interface PreparedDistributionFormat {
  formatRegex: RegExp | undefined;
  urlRegex: RegExp | undefined;
  definition: JsonObject | undefined;
}

const prepareDistributionFormat = createTransformer(
  (format: ModelPropertiesFromTraits<MagdaDistributionFormatTraits>) => {
    return {
      formatRegex: format.formatRegex
        ? new RegExp(format.formatRegex, "i")
        : undefined,
      urlRegex: format.urlRegex ? new RegExp(format.urlRegex, "i") : undefined,
      definition: format.definition ? format.definition : undefined
    };
  }
);

export class MagdaReferenceTraits extends mixTraits(UrlTraits) {
  @primitiveTrait({
    name: "Record ID",
    description: "The ID of the Magda record referred to by this reference.",
    type: "string"
  })
  recordId?: string;

  @anyTrait({
    name: "Magda Record Data",
    description:
      "The available representation of the Magda record as returned by " +
      "the Magda registry API. This representation may not include all " +
      "aspects and it may not be dereferenced."
  })
  magdaRecord?: JsonObject;

  @anyTrait({
    name: "Definition",
    description:
      "The definition of the dereferenced item, overriding properties that " +
      "come from Magda itself."
  })
  definition?: JsonObject;

  // @primitiveArrayTrait({
  //   name: "Magda Record Aspects",
  //   description:
  //   "The record aspects that are included in Magda Record Data if they " +
  //   "If this property is not specified, any aspects that are not represented " +
  //   "Magda Record Data are assumed to have not yet been requested.",
  //   type: "string"
  // })
  // magdaRecordAspects?: string[];

  @objectArrayTrait({
    name: "Distribution Formats",
    description:
      "The supported distribution formats and their mapping to Terria types. " +
      "These are listed in order of preference.",
    type: MagdaDistributionFormatTraits,
    idProperty: "id"
  })
  distributionFormats?: MagdaDistributionFormatTraits[];
}

export default class MagdaCatalogReference extends UrlMixin(
  ReferenceMixin(CreateModel(MagdaReferenceTraits))
) {
  @computed
  get registryUri(): uri.URI | undefined {
    const uri = this.uri;
    if (uri === undefined) {
      return undefined;
    }
    return uri.clone().segment("api/v0/registry");
  }

  @computed
  get preparedDistributionFormats(): PreparedDistributionFormat[] {
    return (
      this.distributionFormats &&
      this.distributionFormats.map(prepareDistributionFormat)
    );
  }

  protected forceLoadReference(
    previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    const existingRecord = this.magdaRecord
      ? toJS(this.magdaRecord)
      : undefined;

    const magdaUri = this.uri;

    const target = MagdaCatalogReference.createMemberFromRecord(
      this.terria,
      magdaUri,
      this.uniqueId,
      existingRecord,
      this.strata,
      "definition",
      previousTarget
    );
    if (target !== undefined) {
      return Promise.resolve(target);
    }

    return this.loadMagdaRecord({
      id: this.recordId,
      optionalAspects: [
        "terria",
        "group",
        "dcat-dataset-strings",
        "dcat-distribution-strings",
        "dataset-distributions",
        "dataset-format"
      ],
      dereference: true
    }).then(record => {
      return MagdaCatalogReference.createMemberFromRecord(
        this.terria,
        magdaUri,
        this.uniqueId,
        record,
        this.strata,
        "definition",
        previousTarget
      );
    });
  }

  private static createMemberFromRecord(
    terria: Terria,
    magdaUri: uri.URI | undefined,
    id: string | undefined,
    record: JsonObject | undefined,
    overrideStrata: Map<string, StratumFromTraits<ModelTraits>> | undefined,
    overrideStrataProperty: string | undefined,
    previousTarget: BaseModel | undefined
  ): BaseModel | undefined {
    if (record === undefined) {
      return undefined;
    }

    const aspects = record.aspects;
    if (!isJsonObject(aspects)) {
      return undefined;
    }

    if (isJsonObject(aspects.group) && Array.isArray(aspects.group.members)) {
      const members = aspects.group.members;
      if (members.every(member => isJsonObject(member))) {
        // Every member has been dereferenced, so we're good to go.
        return MagdaCatalogReference.createGroupFromRecord(
          terria,
          magdaUri,
          id,
          record,
          overrideStrata,
          overrideStrataProperty,
          previousTarget
        );
      } else {
        // Not enough information to create a group yet.
        return undefined;
      }
    }

    if (isJsonObject(aspects.terria) && isJsonString(aspects.terria.type)) {
      // A terria aspect is really all we need, _except_ if the terria aspect indicates
      // this is a group and we don't have a dereferenced group aspect to tell us what's
      // in the group.
      if (aspects.terria.type === "group") {
        // If we had a dereferenced group aspect, we would have returned above.
        return undefined;
      } else {
        return MagdaCatalogReference.createMemberFromTerriaAspect(
          terria,
          magdaUri,
          id,
          record,
          aspects.terria,
          overrideStrata,
          overrideStrataProperty,
          previousTarget
        );
      }
    }

    // // If this is a dataset, we need the distributions to be dereferenced.
    // let distributions: JsonArray | undefined;
    // if (isJsonObject(aspects["dcat-dataset-strings"])) {
    //   const datasetDistributions = aspects["dataset-distributions"];
    //   if (
    //     !isJsonObject(datasetDistributions) ||
    //     !Array.isArray(datasetDistributions.items)
    //   ) {
    //     // Distributions not present
    //     return undefined;
    //   }

    //   distributions = datasetDistributions.items;
    //   if (!distributions.every(distribution => isJsonObject(distribution))) {
    //     // Some of the distributions are not dereferenced.
    //     return undefined;
    //   }
    // }

    // // A distribution is already ready to go
    // if (isJsonObject(aspects["dcat-distribution-strings"])) {
    //   distributions = distributions ? distributions.slice() : [];
    //   distributions.push(aspects["dcat-distribution-strings"]);
    // }

    // if (distributions) {
    //   const match = this.findPreparedDistributionFormat(distributions);
    //   if (
    //     match !== undefined &&
    //     match.format.definition &&
    //     isJsonString(match.format.definition.type)
    //   ) {
    //     return match.format.definition.type;
    //   }
    // }

    return undefined;
  }

  private static createGroupFromRecord(
    terria: Terria,
    magdaUri: uri.URI | undefined,
    id: string | undefined,
    record: JsonObject,
    overrideStrata: Map<string, StratumFromTraits<ModelTraits>> | undefined,
    overrideStrataProperty: string | undefined,
    previousTarget: BaseModel | undefined
  ): BaseModel | undefined {
    const aspects = record.aspects;
    if (!isJsonObject(aspects)) {
      return undefined;
    }

    // top -> dereference property of parent, never needs to change once created
    //        because it uses a NestedStrataMap.
    // bottom -> stuff loaded from magda, needs the new values loaded from magda

    let combined: CatalogGroup;
    let bottom: Model<CatalogGroupTraits>;
    if (previousTarget && previousTarget instanceof CatalogGroup) {
      combined = previousTarget;
      bottom = extractBottomModel(previousTarget)!;
    } else {
      const ModelClass = traitsClassToModelClass(CatalogGroupTraits);
      const top = new ModelClass(
        id,
        terria,
        new NestedStrataMap(
          this.TraitsClass,
          overrideStrata!, // TODO
          overrideStrataProperty!
        )
      );
      bottom = new ModelClass(id, terria);
      combined = createCombinedModel(top, bottom, CatalogGroup);
    }

    StratumOrder.addLoadStratum("magda-group");

    if (isJsonObject(aspects.group) && Array.isArray(aspects.group.members)) {
      const members = aspects.group.members;
      const ids = members.map(member => {
        // TODO: should an ID be required??
        if (!isJsonObject(member) || !isJsonString(member.id)) {
          return;
        }

        const model = MagdaCatalogReference.createMemberFromRecord(
          terria,
          magdaUri,
          member.id,
          member,
          undefined,
          undefined,
          terria.getModelById(BaseModel, member.id)
        );

        if (!model) {
          // Can't create an item or group yet, so create a reference.
          const ref = new MagdaCatalogReference(member.id, terria);
          if (magdaUri) {
            ref.setTrait(CommonStrata.definition, "url", magdaUri.toString());
          }
          ref.setTrait(CommonStrata.definition, "recordId", member.id);
          terria.addModel(ref);
          return ref.uniqueId;
        } else {
          terria.addModel(model);
          return model.uniqueId;
        }
      });
      bottom.setTrait("magda-group", "members", filterOutUndefined(ids));
    }

    if (isJsonObject(aspects.terria)) {
      const terriaStrata = aspects.terria;
      Object.keys(terriaStrata).forEach(stratum => {
        updateModelFromJson(bottom, stratum, terriaStrata[stratum], true);
      });

      // Remove any strata that Magda is no longer providing
      for (let stratum of bottom.strata.keys()) {
        if (stratum !== "magda-group" && !terriaStrata[stratum]) {
          bottom.strata.delete(stratum);
        }
      }
    }

    return combined;
  }

  private static createMemberFromTerriaAspect(
    terria: Terria,
    magdaUri: uri.URI | undefined,
    id: string | undefined,
    record: JsonObject,
    terriaAspect: JsonObject,
    overrideStrata: Map<string, StratumFromTraits<ModelTraits>> | undefined,
    overrideStrataProperty: string | undefined,
    previousTarget: BaseModel | undefined
  ): BaseModel | undefined {
    // top -> dereference property of parent, never needs to change once created
    //        because it uses a NestedStrataMap.
    // bottom -> stuff loaded from magda, needs the new values loaded from magda

    if (!isJsonString(terriaAspect.type)) {
      return undefined;
    }

    // The Model instance that will receive the traits from the terria aspect
    let magdaModel: BaseModel | undefined;

    // The overall Model intance, which may be the same as magdaModel, or it
    // may be a combination of magdaModel and the traits from the overrideStrata.
    let result: BaseModel | undefined;

    if (previousTarget && previousTarget.type === terriaAspect.type) {
      if (overrideStrata && overrideStrataProperty) {
        const potentialMagdaModel = extractBottomModel(previousTarget);
        if (
          potentialMagdaModel !== undefined &&
          potentialMagdaModel.strata instanceof NestedStrataMap &&
          potentialMagdaModel.strata.parent === overrideStrata &&
          potentialMagdaModel.strata.parentProperty === overrideStrataProperty
        ) {
          // We can re-use the previous combined model.
          result = previousTarget;
          magdaModel = potentialMagdaModel;
        }
      } else if (!(previousTarget.strata instanceof NestedStrataMap)) {
        // We can re-use the previous non-combined model.
        result = previousTarget;
        magdaModel = previousTarget;
      }
    }

    if (result === undefined || magdaModel === undefined) {
      // Couldn't re-use the previous target, so create a new one.
      if (overrideStrata && overrideStrataProperty) {
        const ModelClass = CatalogMemberFactory.find(terriaAspect.type);
        if (ModelClass === undefined) {
          throw new TerriaError({
            sender: this,
            title: "Unknown type",
            message: `Could not create unknown model type ${terriaAspect.type}.`
          });
        }
        const LayerClass = traitsClassToModelClass(ModelClass.TraitsClass);
        const top = new LayerClass(
          id,
          terria,
          new NestedStrataMap(
            this.TraitsClass,
            overrideStrata,
            overrideStrataProperty
          )
        );
        magdaModel = new LayerClass(id, terria);
        result = createCombinedModel(top, magdaModel, ModelClass);
      } else {
        magdaModel = CatalogMemberFactory.create(
          terriaAspect.type,
          id,
          terria
        );
        if (magdaModel === undefined) {
          throw new TerriaError({
            sender: this,
            title: "Unknown type",
            message: `Could not create unknown model type ${terriaAspect.type}.`
          });
        }
        result = magdaModel;
      }
    }

    Object.keys(terriaAspect).forEach(stratum => {
      if (stratum === "type") {
        return;
      }
      updateModelFromJson(magdaModel!, stratum, terriaAspect[stratum], true);
    });

    // Remove any strata that Magda is no longer providing
    for (let stratum of magdaModel.strata.keys()) {
      if (!terriaAspect[stratum]) {
        magdaModel.strata.delete(stratum);
      }
    }

    return result;
  }

  protected findPreparedDistributionFormat(
    distributions: JsonArray
  ):
    | {
        distribution: JsonObject;
        format: PreparedDistributionFormat;
      }
    | undefined {
    for (let i = 0; i < this.preparedDistributionFormats.length; ++i) {
      const distributionFormat = this.preparedDistributionFormats[i];
      const formatRegex = distributionFormat.formatRegex;
      const urlRegex = distributionFormat.urlRegex;

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

        const dcatJson = aspects["dcat-distribution-strings"];
        const datasetFormat = aspects["dataset-format"];

        let format: string | undefined;
        let url: string | undefined;

        if (isJsonObject(dcatJson)) {
          if (typeof dcatJson.format === "string") {
            format = dcatJson.format;
          }
          if (typeof dcatJson.downloadURL === "string") {
            url = dcatJson.downloadURL;
          }

          if (url === undefined && typeof dcatJson.accessURL === "string") {
            url = dcatJson.accessURL;
          }
        }

        if (
          isJsonObject(datasetFormat) &&
          typeof datasetFormat.format === "string"
        ) {
          format = datasetFormat.format;
        }

        if (format === undefined || url === undefined) {
          continue;
        }

        if (
          (formatRegex !== undefined && !formatRegex.test(format)) ||
          (urlRegex !== undefined && !urlRegex.test(url))
        ) {
          continue;
        }

        // We have a match!
        return {
          distribution: distribution,
          format: distributionFormat
        };
      }
    }

    return undefined;
  }

  protected loadMagdaRecord(options: RecordOptions): Promise<JsonObject> {
    const recordUri = this.buildMagdaRecordUri(options);
    if (recordUri === undefined) {
      return Promise.reject(
        new TerriaError({
          sender: this,
          title: "Cannot load Magda record",
          message: "The Magda URL or the record ID is unknown."
        })
      );
    }
    const proxiedUrl = proxyCatalogItemUrl(this, recordUri.toString(), "0d");
    return loadJson(proxiedUrl);
  }

  protected buildMagdaRecordUri(options: RecordOptions): uri.URI | undefined {
    const registryUri = this.registryUri;
    if (options.id === undefined || registryUri === undefined) {
      return undefined;
    }

    const recordUri = registryUri
      .clone()
      .segment(`records/${encodeURIComponent(options.id)}`);

    if (options.aspects) {
      recordUri.addQuery("aspect", options.aspects);
    }
    if (options.optionalAspects) {
      recordUri.addQuery("optionalAspect", options.optionalAspects);
    }
    if (options.dereference) {
      recordUri.addQuery("dereference", "true");
    }

    return recordUri;
  }
}
