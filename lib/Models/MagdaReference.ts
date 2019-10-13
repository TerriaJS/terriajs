import { computed, toJS } from "mobx";
import { createTransformer } from "mobx-utils";
import filterOutUndefined from "../Core/filterOutUndefined";
import {
  isJsonObject,
  isJsonString,
  JsonArray,
  JsonObject
} from "../Core/Json";
import loadJson from "../Core/loadJson";
import TerriaError from "../Core/TerriaError";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import MagdaDistributionFormatTraits from "../Traits/MagdaDistributionFormatTraits";
import MagdaReferenceTraits from "../Traits/MagdaReferenceTraits";
import CatalogGroup from "./CatalogGroupNew";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import { BaseModel } from "./Model";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import Terria from "./Terria";
import updateModelFromJson from "./updateModelFromJson";
import StratumFromTraits from "./StratumFromTraits";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import createStratumInstance from "./createStratumInstance";

export default class MagdaReference extends UrlMixin(
  ReferenceMixin(CreateModel(MagdaReferenceTraits))
) {
  static readonly defaultDistributionFormats: StratumFromTraits<
    MagdaDistributionFormatTraits
  >[] = [
    createStratumInstance(MagdaDistributionFormatTraits, {
      id: "WMS",
      formatRegex: "^wms$",
      definition: {
        type: "wms"
      }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
      id: "EsriMapServer",
      formatRegex: "^esri (rest|tiled map service)$",
      urlRegex: "MapServer",
      definition: {
        type: "esri-mapServer"
      }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
      id: "CSV",
      formatRegex: "^csv(-geo-)?",
      definition: {
        type: "csv"
      }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
      id: "CZML",
      formatRegex: "^czml$",
      definition: {
        type: "czml"
      }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
      id: "KML",
      formatRegex: "^km[lz]$",
      definition: {
        type: "kml"
      }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
      id: "GeoJSON",
      formatRegex: "^geojson$",
      definition: {
        type: "geojson"
      }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
      id: "WFS",
      formatRegex: "^wfs$",
      definition: {
        type: "wfs"
      }
    }),
    createStratumInstance(MagdaDistributionFormatTraits, {
      id: "EsriFeatureServer",
      formatRegex: "^esri rest$",
      urlRegex: "FeatureServer",
      definition: {
        type: "esri-featureServer"
      }
    })
  ];

  static readonly type = "magda";

  get type() {
    return MagdaReference.type;
  }

  constructor(id: string | undefined, terria: Terria) {
    super(id, terria);

    this.setTrait(
      CommonStrata.defaults,
      "distributionFormats",
      MagdaReference.defaultDistributionFormats
    );
  }

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
    const distributionFormats = this.preparedDistributionFormats;

    const target = MagdaReference.createMemberFromRecord(
      this.terria,
      distributionFormats,
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
      return MagdaReference.createMemberFromRecord(
        this.terria,
        distributionFormats,
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
    distributionFormats: readonly PreparedDistributionFormat[],
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
        return MagdaReference.createGroupFromRecord(
          terria,
          distributionFormats,
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
        return MagdaReference.createMemberFromTerriaAspect(
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

    // If this is a dataset, we need the distributions to be dereferenced.
    let distributions: JsonArray | undefined;
    if (isJsonObject(aspects["dcat-dataset-strings"])) {
      const datasetDistributions = aspects["dataset-distributions"];
      if (
        !isJsonObject(datasetDistributions) ||
        !Array.isArray(datasetDistributions.distributions)
      ) {
        // Distributions not present
        return undefined;
      }

      distributions = datasetDistributions.distributions;
      if (!distributions.every(distribution => isJsonObject(distribution))) {
        // Some of the distributions are not dereferenced.
        return undefined;
      }
    }

    // A distribution is already ready to go
    if (isJsonObject(aspects["dcat-distribution-strings"])) {
      distributions = distributions ? distributions.slice() : [];
      distributions.push(aspects["dcat-distribution-strings"]);
    }

    if (distributions) {
      const match = MagdaReference.findPreparedDistributionFormat(
        distributionFormats,
        distributions
      );
      if (
        match !== undefined &&
        match.format.definition &&
        isJsonString(match.format.definition.type)
      ) {
        return MagdaReference.createMemberFromDistributionFormat(
          terria,
          magdaUri,
          id,
          record,
          match.distribution,
          match.format,
          override,
          previousTarget
        );
      }
    }

    return undefined;
  }

  private static createGroupFromRecord(
    terria: Terria,
    distributionFormats: readonly PreparedDistributionFormat[],
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

        const model = MagdaReference.createMemberFromRecord(
          terria,
          distributionFormats,
          magdaUri,
          member.id,
          member,
          overriddenMember,
          terria.getModelById(BaseModel, member.id)
        );

        if (!model) {
          // Can't create an item or group yet, so create a reference.
          const ref = new MagdaReference(member.id, terria);
          if (magdaUri) {
            ref.setTrait(CommonStrata.definition, "url", magdaUri.toString());
          }
          ref.setTrait(CommonStrata.definition, "recordId", memberId);

          if (isJsonObject(member.aspects) && isJsonObject(member.aspects.group)) {
            // This is most likely a group.
            ref.hints.setTrait(CommonStrata.definition, "isGroup", true);
          } else {
            // This is most likely a mappable or chartable item.
            ref.hints.setTrait(CommonStrata.definition, "isMappable", true);
            ref.hints.setTrait(CommonStrata.definition, "isChartable", true);
          }

          if (isJsonString(member.name)) {
            ref.hints.setTrait(CommonStrata.definition, "name", member.name);
          }

          if (overriddenMember) {
            ref.setTrait(CommonStrata.definition, "override", overriddenMember);
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

      if (isJsonString(record.name)) {
        group.setTrait(CommonStrata.underride, "name", record.name);
      }
      group.setTrait(
        CommonStrata.underride,
        "members",
        filterOutUndefined(ids)
      );
    }

    if (isJsonObject(aspects.terria)) {
      const terriaStrata = aspects.terria;
      Object.keys(terriaStrata).forEach(stratum => {
        if (stratum === "id" || stratum === "type") {
          return;
        }
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

    if (isJsonString(record.name)) {
      result.setTrait(CommonStrata.underride, "name", record.name);
    }

    Object.keys(terriaAspect).forEach(stratum => {
      if (stratum === "type" || stratum === "id") {
        return;
      }
      updateModelFromJson(result, stratum, terriaAspect[stratum], true);
    });

    if (override) {
      updateModelFromJson(result, CommonStrata.override, override, true);
    }

    return result;
  }

  private static createMemberFromDistributionFormat(
    terria: Terria,
    magdaUri: uri.URI | undefined,
    id: string | undefined,
    datasetRecord: JsonObject,
    distributionRecord: JsonObject,
    format: PreparedDistributionFormat,
    override: JsonObject | undefined,
    previousTarget: BaseModel | undefined
  ): BaseModel | undefined {
    if (
      !isJsonString(format.definition.type) ||
      !isJsonObject(datasetRecord.aspects) ||
      !isJsonObject(distributionRecord.aspects)
    ) {
      return undefined;
    }
    let result: BaseModel;

    if (previousTarget && previousTarget.type === format.definition.type) {
      result = previousTarget;
    } else {
      // Couldn't re-use the previous target, so create a new one.
      const newMember = CatalogMemberFactory.create(
        format.definition.type,
        id,
        terria
      );
      if (newMember === undefined) {
        throw new TerriaError({
          sender: this,
          title: "Unknown type",
          message: `Could not create unknown model type ${
            format.definition.type
          }.`
        });
      }
      result = newMember;
    }

    const datasetDcat = datasetRecord.aspects["dcat-dataset-strings"];
    const distributionDcat = distributionRecord.aspects["dcat-distribution-strings"];

    const info: StratumFromTraits<InfoSectionTraits>[] = [];

    if (isJsonObject(datasetDcat) && isJsonString(datasetDcat.description)) {
      info.push({
        name: "Dataset Description",
        content: datasetDcat.description
      });
    }

    if (
      isJsonObject(distributionDcat) &&
      isJsonString(distributionDcat.description)
    ) {
      info.push({
        name: "Distribution Description",
        content: distributionDcat.description
      });
    }

    let url: string | undefined;

    if (isJsonObject(distributionDcat)) {
      if (isJsonString(distributionDcat.downloadURL)) {
        url = distributionDcat.downloadURL;
      }

      if (url === undefined && isJsonString(distributionDcat.accessURL)) {
        url = distributionDcat.accessURL;
      }
    }

    updateModelFromJson(
      result,
      CommonStrata.underride,
      {
        name: datasetRecord.name,
        url: url,
        info: info
      },
      true
    );

    updateModelFromJson(
      result,
      CommonStrata.definition,
      format.definition,
      true
    );

    if (override) {
      updateModelFromJson(result, CommonStrata.override, override, true);
    }

    return result;
  }

  private static findPreparedDistributionFormat(
    distributionFormats: readonly PreparedDistributionFormat[],
    distributions: JsonArray
  ):
    | {
        distribution: JsonObject;
        format: PreparedDistributionFormat;
      }
    | undefined {
    for (let i = 0; i < distributionFormats.length; ++i) {
      const distributionFormat = distributionFormats[i];
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

export interface RecordOptions {
  id: string | undefined;
  aspects?: string[];
  optionalAspects?: string[];
  dereference?: boolean;
}

interface PreparedDistributionFormat {
  formatRegex: RegExp | undefined;
  urlRegex: RegExp | undefined;
  definition: JsonObject;
}

const prepareDistributionFormat = createTransformer(
  (format: ModelPropertiesFromTraits<MagdaDistributionFormatTraits>) => {
    return {
      formatRegex: format.formatRegex
        ? new RegExp(format.formatRegex, "i")
        : undefined,
      urlRegex: format.urlRegex ? new RegExp(format.urlRegex, "i") : undefined,
      definition: format.definition || {}
    };
  }
);
