import i18next from "i18next";
import { computed, toJS, makeObservable, override } from "mobx";
import { createTransformer } from "mobx-utils";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import {
  isJsonObject,
  isJsonString,
  JsonArray,
  JsonObject
} from "../../../Core/Json";
import loadJson from "../../../Core/loadJson";
import runLater from "../../../Core/runLater";
import TerriaError from "../../../Core/TerriaError";
import AccessControlMixin from "../../../ModelMixins/AccessControlMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../../ModelMixins/ReferenceMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ModelTraits from "../../../Traits/ModelTraits";
import MagdaDistributionFormatTraits from "../../../Traits/TraitsClasses/MagdaDistributionFormatTraits";
import MagdaReferenceTraits from "../../../Traits/TraitsClasses/MagdaReferenceTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import { BaseModel } from "../../Definition/Model";
import ModelPropertiesFromTraits from "../../Definition/ModelPropertiesFromTraits";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import updateModelFromJson from "../../Definition/updateModelFromJson";
import Terria from "../../Terria";
import CatalogMemberFactory from "../CatalogMemberFactory";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

const magdaRecordStratum = "magda-record";
StratumOrder.addDefaultStratum(magdaRecordStratum);

// If you want to supply headers sent for magda requests, supply them in
// config parameters
export interface MagdaReferenceHeaders {
  [key: string]: string;
}

export default class MagdaReference extends AccessControlMixin(
  UrlMixin(ReferenceMixin(CreateModel(MagdaReferenceTraits)))
) {
  static readonly defaultDistributionFormats: StratumFromTraits<MagdaDistributionFormatTraits>[] =
    [
      createStratumInstance(MagdaDistributionFormatTraits, {
        id: "WMS",
        formatRegex: "^wms$",
        definition: {
          type: "wms"
        }
      }),
      createStratumInstance(MagdaDistributionFormatTraits, {
        id: "WMS-GROUP",
        formatRegex: "^wms-group$",
        definition: {
          type: "wms-group"
        }
      }),
      createStratumInstance(MagdaDistributionFormatTraits, {
        id: "EsriMapServer",
        formatRegex: "^esri (mapserver|map server|rest|tiled map service)$",
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
        formatRegex: "ESRI (MAPSERVER|FEATURESERVER)", // We still allow `ESRI MAPSERVER` to be considered for compatibility reason
        urlRegex: "FeatureServer$|FeatureServer/$", // url Regex will exclude MapServer urls
        definition: {
          type: "esri-featureServer-group"
        }
      }),
      createStratumInstance(MagdaDistributionFormatTraits, {
        id: "EsriFeatureServer",
        formatRegex: "ESRI (MAPSERVER|FEATURESERVER)", // We still allow `ESRI MAPSERVER` to be considered for compatibility reason
        urlRegex: "FeatureServer/d",
        definition: {
          type: "esri-featureServer"
        }
      })
    ];

  static readonly type = "magda";

  get type() {
    return MagdaReference.type;
  }

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel,
    strata?: Map<string, StratumFromTraits<ModelTraits>>
  ) {
    super(id, terria, sourceReference, strata);

    makeObservable(this);

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

  @override
  get accessType(): string {
    return this.magdaRecordAcessType ?? super.accessType;
  }

  @computed
  private get magdaRecordAcessType(): string | undefined {
    return this.magdaRecord
      ? getAccessTypeFromMagdaRecord(this.magdaRecord)
      : undefined;
  }

  protected async forceLoadReference(
    previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    const existingRecord = this.magdaRecord
      ? toJS(this.magdaRecord)
      : undefined;

    const magdaUri = this.uri;
    const override = toJS(this.override);
    const addOrOverrideAspects = toJS(this.addOrOverrideAspects);
    const distributionFormats = this.preparedDistributionFormats;

    // `runLater` is needed due to no actions in `AsyncLoader` computed promise (See AsyncLoader.ts)
    return await runLater(async () => {
      const target = MagdaReference.createMemberFromRecord(
        this.terria,
        this,
        distributionFormats,
        magdaUri,
        this.uniqueId,
        existingRecord,
        override,
        previousTarget,
        addOrOverrideAspects
      );

      if (target !== undefined) {
        return target;
      }

      if (
        this.recordId === undefined &&
        this.terria.catalogProvider?.isProviderFor(this)
      ) {
        // Occurs if record is no longer found inside containing group
        // (i.e moved, deleted or user no longer has access, including if not logged in)
        throw this.terria.catalogProvider.createLoadError(this);
      }

      const record = await this.loadMagdaRecord({
        id: this.recordId,
        optionalAspects: [
          "terria",
          "group",
          "dcat-dataset-strings",
          "dcat-distribution-strings",
          "dataset-distributions",
          "dataset-format"
        ],
        dereference: true,
        magdaReferenceHeaders:
          this.terria.configParameters.magdaReferenceHeaders
      });

      return MagdaReference.createMemberFromRecord(
        this.terria,
        this,
        distributionFormats,
        magdaUri,
        this.uniqueId,
        record,
        override,
        previousTarget,
        addOrOverrideAspects
      );
    });
  }

  private static overrideRecordAspects(
    record: JsonObject | undefined,
    override: JsonObject | undefined
  ) {
    if (record && override && isJsonObject(override.aspects)) {
      if (isJsonObject(record.aspects)) {
        for (const key in override.aspects)
          record.aspects[key] = override.aspects[key];
      } else {
        record.aspects = override.aspects;
      }
    }
  }

  static createMemberFromRecord(
    terria: Terria,
    sourceReference: BaseModel | undefined,
    distributionFormats: readonly PreparedDistributionFormat[],
    magdaUri: uri.URI | undefined,
    id: string | undefined,
    record: JsonObject | undefined,
    override: JsonObject | undefined,
    previousTarget: BaseModel | undefined,
    addOrOverrideAspects: JsonObject | undefined = undefined
  ): BaseModel | undefined {
    if (record === undefined) {
      return undefined;
    }

    this.overrideRecordAspects(record, addOrOverrideAspects);

    const aspects = record.aspects;
    if (!isJsonObject(aspects)) {
      return undefined;
    }

    if (isJsonObject(aspects.group) && Array.isArray(aspects.group.members)) {
      const members = aspects.group.members;
      if (members.every((member) => isJsonObject(member))) {
        // Every member has been dereferenced, so we're good to go.
        return MagdaReference.createGroupFromRecord(
          terria,
          sourceReference,
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
        // TODO: could be other types of groups!
        // If we had a dereferenced group aspect, we would have returned above.
        return undefined;
      } else {
        return MagdaReference.createMemberFromTerriaAspect(
          terria,
          sourceReference,
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
      if (!distributions.every((distribution) => isJsonObject(distribution))) {
        // Some of the distributions are not dereferenced.
        return undefined;
      }
    }

    // A distribution is already ready to go
    if (isJsonObject(aspects["dcat-distribution-strings"])) {
      distributions = distributions ? distributions.slice() : [];
      distributions.push(record);
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
          sourceReference,
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
    sourceReference: BaseModel | undefined,
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

    const terriaAspect = aspects.terria;
    const type =
      isJsonObject(terriaAspect) && isJsonString(terriaAspect.type)
        ? terriaAspect.type
        : "group";

    const ModelClass = CatalogMemberFactory.find(type);
    if (ModelClass === undefined) {
      throw new TerriaError({
        sender: this,
        title: i18next.t("models.catalog.unsupportedTypeTitle"),
        message: i18next.t("models.catalog.unsupportedTypeMessage", { type })
      });
    }

    let group: BaseModel;
    if (previousTarget && previousTarget instanceof ModelClass) {
      group = previousTarget;
    } else {
      group = new ModelClass(id, terria, sourceReference);
    }

    if (isJsonObject(aspects.group) && Array.isArray(aspects.group.members)) {
      const members = aspects.group.members;
      const ids = members.map((member) => {
        if (!isJsonObject(member) || !isJsonString(member.id)) {
          return undefined;
        }

        const memberId = member.id;

        let overriddenMember: JsonObject | undefined;
        if (override && Array.isArray(override.members)) {
          overriddenMember = override.members.find(
            (member) => isJsonObject(member) && member.id === memberId
          ) as JsonObject | undefined;
        }

        const model = MagdaReference.createMemberFromRecord(
          terria,
          undefined,
          distributionFormats,
          magdaUri,
          member.id,
          member,
          overriddenMember,
          terria.getModelById(BaseModel, member.id)
        );
        let shareKeys;
        if (
          isJsonObject(member.aspects, false) &&
          isJsonObject(member.aspects.terria, false) &&
          Array.isArray(member.aspects.terria.shareKeys)
        ) {
          shareKeys = member.aspects.terria.shareKeys.filter(isJsonString);
        }

        if (!model) {
          // Can't create an item or group yet, so create a reference.
          const ref = new MagdaReference(member.id, terria, undefined);

          if (magdaUri) {
            ref.setTrait(CommonStrata.definition, "url", magdaUri.toString());
          }
          ref.setTrait(CommonStrata.definition, "recordId", memberId);

          if (
            isJsonObject(member.aspects, false) &&
            isJsonObject(member.aspects.group, false)
          ) {
            // This is most likely a group.
            ref.setTrait(CommonStrata.definition, "isGroup", true);
          } else {
            // This is most likely a mappable or chartable item.
            ref.setTrait(CommonStrata.definition, "isMappable", true);
            ref.setTrait(CommonStrata.definition, "isChartable", true);
          }

          // Use the name from the terria aspect if there is one.
          if (
            isJsonObject(member.aspects, false) &&
            isJsonObject(member.aspects.terria, false) &&
            isJsonObject(member.aspects.terria.definition, false) &&
            isJsonString(member.aspects.terria.definition.name)
          ) {
            ref.setTrait(
              CommonStrata.definition,
              "name",
              member.aspects.terria.definition.name
            );
          } else if (isJsonString(member.name)) {
            ref.setTrait(CommonStrata.definition, "name", member.name);
          }

          if (overriddenMember) {
            ref.setTrait(CommonStrata.definition, "override", overriddenMember);
          }

          if (terria.getModelById(BaseModel, member.id) === undefined) {
            terria.addModel(ref, shareKeys);
          }

          if (AccessControlMixin.isMixedInto(ref)) {
            ref.setAccessType(getAccessTypeFromMagdaRecord(member));
          }

          return ref.uniqueId;
        } else {
          if (terria.getModelById(BaseModel, member.id) === undefined) {
            terria.addModel(model, shareKeys);
          }
          if (AccessControlMixin.isMixedInto(model)) {
            model.setAccessType(getAccessTypeFromMagdaRecord(member));
          }
          return model.uniqueId;
        }
      });

      if (isJsonString(record.name)) {
        group.setTrait(magdaRecordStratum, "name", record.name);
      }
      group.setTrait(magdaRecordStratum, "members", filterOutUndefined(ids));
      if (GroupMixin.isMixedInto(group)) {
        console.log(`Refreshing ids for ${group.uniqueId}`);
        group.refreshKnownContainerUniqueIds(group.uniqueId);
      }
    }

    if (isJsonObject(aspects.terria, false)) {
      const terriaAspect = aspects.terria;
      Object.keys(terriaAspect).forEach((key) => {
        const terriaStratum = terriaAspect[key];
        if (
          key === "id" ||
          key === "type" ||
          key === "shareKeys" ||
          !isJsonObject(terriaStratum, false)
        ) {
          return;
        }
        updateModelFromJson(group, key, terriaStratum, true).logError();
      });
    }

    if (override) {
      updateModelFromJson(
        group,
        CommonStrata.override,
        override,
        true
      ).logError();
    }

    return group;
  }

  private static createMemberFromTerriaAspect(
    terria: Terria,
    sourceReference: BaseModel | undefined,
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
        terria,
        sourceReference
      );
      if (newMember === undefined) {
        console.error(
          `Could not create unknown model type ${terriaAspect.type}.`
        );
        // don't create a stub here, as magda should rarely create unknown model types
        // and we'll let the UI highlight that it's bad rather than bandaging an unknown type
        return undefined;
      }
      result = newMember;
    }

    if (isJsonString(record.name)) {
      result.setTrait(magdaRecordStratum, "name", record.name);
    }

    Object.keys(terriaAspect).forEach((key) => {
      const terriaStratum = terriaAspect[key];
      if (
        key === "id" ||
        key === "type" ||
        key === "shareKeys" ||
        !isJsonObject(terriaStratum, false)
      ) {
        return;
      }
      updateModelFromJson(result, key, terriaStratum, true).catchError(
        (error) => {
          error.log();
          result.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
        }
      );
    });

    if (override) {
      updateModelFromJson(
        result,
        CommonStrata.override,
        override,
        true
      ).logError();
    }

    return result;
  }

  private static createMemberFromDistributionFormat(
    terria: Terria,
    sourceReference: BaseModel | undefined,
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
        terria,
        sourceReference
      );
      if (newMember === undefined) {
        throw new TerriaError({
          sender: this,
          title: i18next.t("models.catalog.unsupportedTypeTitle"),
          message: i18next.t("models.catalog.unsupportedTypeMessage", {
            type: format.definition.type
          })
        });
      }
      result = newMember;
    }

    const datasetDcat = datasetRecord.aspects["dcat-dataset-strings"];
    const distributionDcat =
      distributionRecord.aspects["dcat-distribution-strings"];

    let url: string | undefined;

    if (isJsonObject(distributionDcat)) {
      if (isJsonString(distributionDcat.downloadURL)) {
        url = distributionDcat.downloadURL;
      }

      if (url === undefined && isJsonString(distributionDcat.accessURL)) {
        url = distributionDcat.accessURL;
      }
    }

    const definition: any = {
      url: url,
      info: [],
      ...format.definition
    };

    if (
      isJsonObject(datasetDcat) &&
      isJsonString(datasetDcat.description) &&
      !definition.info.find(
        (section: any) => section.name === "Dataset Description"
      )
    ) {
      definition.info.push({
        name: "Dataset Description",
        content: datasetDcat.description
      });
    }

    if (
      isJsonObject(distributionDcat) &&
      isJsonString(distributionDcat.description) &&
      !definition.info.find(
        (section: any) => section.name === "Distribution Description"
      )
    ) {
      definition.info.push({
        name: "Distribution Description",
        content: distributionDcat.description
      });
    }

    if (isJsonString(datasetRecord.name))
      updateModelFromJson(
        result,
        magdaRecordStratum,
        {
          name: datasetRecord.name
        },
        true
      ).logError();

    updateModelFromJson(
      result,
      CommonStrata.definition,
      definition,
      true
    ).logError();

    if (override) {
      updateModelFromJson(
        result,
        CommonStrata.override,
        override,
        true
      ).logError();
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

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "0d";
  }

  protected loadMagdaRecord(options: RecordOptions): Promise<JsonObject> {
    const recordUri = this.buildMagdaRecordUri(options);
    if (recordUri === undefined) {
      return Promise.reject(
        new TerriaError({
          sender: this,
          title: i18next.t("models.magda.idsNotSpecifiedTitle"),
          message: i18next.t("models.magda.idsNotSpecifiedMessage")
        })
      );
    }
    const proxiedUrl = proxyCatalogItemUrl(this, recordUri.toString());

    return loadJson(proxiedUrl, options.magdaReferenceHeaders);
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
  magdaReferenceHeaders?: MagdaReferenceHeaders;
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

function getAccessTypeFromMagdaRecord(
  magdaRecord: Record<string, any>
): string {
  const record = toJS(magdaRecord);

  // Magda V2 access control has higher priority.
  if (record?.aspects?.["access-control"]) {
    return record.aspects["access-control"].orgUnitId
      ? record.aspects["access-control"].constraintExemption
        ? "public"
        : "non-public"
      : "public";
  } else if (record?.aspects?.["esri-access-control"]) {
    return record.aspects["esri-access-control"].access;
  } else {
    return "public";
  }
}
