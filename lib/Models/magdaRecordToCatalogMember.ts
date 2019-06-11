import { isJsonObject, JsonObject } from "../Core/Json";
import MagdaDistributionFormatTraits from "../Traits/MagdaDistributionFormatTraits";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";
import { toJS } from "mobx";

interface MagdaPreparedDistributionFormat {
  readonly formatRegex: RegExp | undefined;
  readonly urlRegex: RegExp | undefined;
  readonly definition: JsonObject | null | undefined;
}

interface Options {
  /**
   * The base URL of the Magda server.
   */
  magdaBaseUrl: string;

  /**
   * The Magda record.
   */
  record: JsonObject;

  /**
   * The name to use for the model. If not specified, the record's name is used.
   */
  name?: string;

  /**
   * The ID of the preferred distribution to access.
   */
  preferredDistributionId?: string;

  /**
   * The supported distribution formats and their mapping to Terria types.
   * These are listed in order of preference. This property is only used
   * for records that do not have a `terria` aspect and are not groups.
   */
  distributionFormats?:
    | readonly MagdaPreparedDistributionFormat[]
    | null
    | undefined;

  /**
   * The catalog member definition to use for _all_ catalog items, regardless
   * of type. The format-specified definition will be layered on top of this
   * one. This property is used for groups, but is _not_ used for records that
   * have a `terria` aspect.
   */
  definition?: JsonObject;
}

/**
 * Turns a Magda record, with any relevant aspects and `dereference=true`, into a Terria
 * catalog member definition suitable for sending to `upsertModelFromJson`.
 * @param record The record and dereferenced aspects.
 * @param options Options for creating the catalog member.
 */
export default function magdaRecordToCatalogMemberDefinition(
  options: Options
): JsonObject | undefined {
  const record = options.record;
  const aspects = record.aspects;
  if (!isJsonObject(aspects)) {
    return undefined;
  }

  const terria = isJsonObject(aspects.terria) ? aspects.terria : {};
  const group = isJsonObject(aspects.group) ? aspects.group : {};
  const maybeDatasetDistributions = aspects["dataset-distributions"];
  const datasetDistributions = isJsonObject(maybeDatasetDistributions)
    ? maybeDatasetDistributions
    : {};

  if (group && group.members) {
    // Represent as a Magda catalog group so that we can load members when
    // the group is opened.
    const groupDefinition: any = {
      id: record.id,
      name: record.name,
      type: "magda-group",
      url: options.magdaBaseUrl,
      groupId: record.id,
      definition: {
        id: record.id,
        type: terria.type,
        members: group.members
      }
    };

    // If the `terria` aspect has `members`, remove any that are simple
    // strings. We need the actual member definitions, which we'll get from
    // the dereferenced `group` aspect.
    // TODO: merge the terria definition with our traits definition, don't just choose one or the other.
    const definition = isJsonObject(terria.definition)
      ? terria.definition
      : options.definition;
    if (definition !== undefined) {
      Object.keys(definition).forEach(key => {
        const value = definition[key];
        if (key === "members" && Array.isArray(value)) {
          value.forEach(member => {
            if (typeof member !== "string") {
              groupDefinition.members.push(member);
            }
          });
        } else {
          groupDefinition.definition[key] = value;
        }
      });
    }

    return groupDefinition;
  } else if (terria && terria.type && isJsonObject(terria.definition)) {
    return {
      id: record.id,
      name: record.name,
      type: terria.type,
      ...terria.definition
    };
  } else {
    // Find a suitable definition for this non-Terria dataset.
    const definition = options.definition || {};
    const distributionFormats = options.distributionFormats || [];
    const distributions = Array.isArray(datasetDistributions.distributions)
      ? datasetDistributions.distributions
      : [];

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

        const completeDefinition = Object.assign(
          {
            name: options.name || record.name,
            localId: record.id,
            url: url
          },
          toJS(definition),
          toJS(distributionFormat.definition)
        );

        return completeDefinition;
      }
    }
    return undefined;
  }
}
