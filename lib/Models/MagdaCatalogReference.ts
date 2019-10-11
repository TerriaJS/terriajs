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
import DerivedStrataMap from "../Traits/DerivedStrataMap";

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
    name: "Override",
    description:
      "The properties to apply to the dereferenced item, overriding properties that " +
      "come from Magda itself."
  })
  override?: JsonObject;

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
    const override = toJS(this.override);

    const target = MagdaCatalogReference.createMemberFromRecord(
      this.terria,
      magdaUri,
      this.uniqueId,
      existingRecord,
      override,
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
        override,
        previousTarget
      );
    });
  }

  private static createMemberFromRecord(
    terria: Terria,
    magdaUri: uri.URI | undefined,
    id: string | undefined,
    record: JsonObject | undefined,
    override: JsonObject | undefined,
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
          override,
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
          override,
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
    override: JsonObject | undefined,
    previousTarget: BaseModel | undefined
  ): BaseModel | undefined {
    const aspects = record.aspects;
    if (!isJsonObject(aspects)) {
      return undefined;
    }

    let group: CatalogGroup;
    if (previousTarget && previousTarget instanceof CatalogGroup) {
      group = previousTarget;
    } else {
      group = new CatalogGroup(id, terria);
    }

    if (isJsonObject(aspects.group) && Array.isArray(aspects.group.members)) {
      const members = aspects.group.members;
      const ids = members.map(member => {
        if (!isJsonObject(member) || !isJsonString(member.id)) {
          return;
        }

        const memberId = member.id;

        let overriddenMember: JsonObject | undefined;
        if (override && Array.isArray(override.members)) {
          overriddenMember = override.members.find(
            member => isJsonObject(member) && member.id === memberId
          ) as JsonObject | undefined;
        }

        const model = MagdaCatalogReference.createMemberFromRecord(
          terria,
          magdaUri,
          member.id,
          member,
          overriddenMember,
          terria.getModelById(BaseModel, member.id)
        );

        if (!model) {
          // Can't create an item or group yet, so create a reference.
          const ref = new MagdaCatalogReference(member.id, terria);
          if (magdaUri) {
            ref.setTrait(CommonStrata.definition, "url", magdaUri.toString());
          }
          ref.setTrait(CommonStrata.definition, "recordId", memberId);

          if (overriddenMember) {
            ref.setTrait(
              CommonStrata.definition,
              "override",
              overriddenMember
            );
          }

          terria.addModel(ref);
          return ref.uniqueId;
        } else {
          if (terria.getModelById(BaseModel, member.id) === undefined) {
            terria.addModel(model);
          }
          return model.uniqueId;
        }
      });

      group.setTrait(CommonStrata.underride, "members", filterOutUndefined(ids));
    }

    if (isJsonObject(aspects.terria)) {
      const terriaStrata = aspects.terria;
      Object.keys(terriaStrata).forEach(stratum => {
        updateModelFromJson(group, stratum, terriaStrata[stratum], true);
      });
    }

    if (override) {
      updateModelFromJson(group, CommonStrata.override, override, true);
    }

    return group;
  }

  private static createMemberFromTerriaAspect(
    terria: Terria,
    magdaUri: uri.URI | undefined,
    id: string | undefined,
    record: JsonObject,
    terriaAspect: JsonObject,
    override: JsonObject | undefined,
    previousTarget: BaseModel | undefined
  ): BaseModel | undefined {
    // top -> dereference property of parent, never needs to change once created
    //        because it uses a NestedStrataMap.
    // bottom -> stuff loaded from magda, needs the new values loaded from magda

    if (!isJsonString(terriaAspect.type)) {
      return undefined;
    }

    let result: BaseModel;

    if (previousTarget && previousTarget.type === terriaAspect.type) {
      result = previousTarget;
    } else {
      // Couldn't re-use the previous target, so create a new one.
      const newMember = CatalogMemberFactory.create(
        terriaAspect.type,
        id,
        terria
      );
      if (newMember === undefined) {
        throw new TerriaError({
          sender: this,
          title: "Unknown type",
          message: `Could not create unknown model type ${terriaAspect.type}.`
        });
      }
      result = newMember;
    }

    Object.keys(terriaAspect).forEach(stratum => {
      if (stratum === "type") {
        return;
      }
      updateModelFromJson(result, stratum, terriaAspect[stratum], true);
    });

    if (override) {
      updateModelFromJson(result, CommonStrata.override, override, true);
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
