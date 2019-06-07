import { isJsonObject, JsonObject } from "../Core/Json";
import MagdaDistributionFormatTraits from "../Traits/MagdaDistributionFormatTraits";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";

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
   * The supported distribution formats and their mapping to Terria types.
   * These are listed in order of preference. This property is only used
   * for records that do not have a `terria` aspect and are not groups.
   */
  distributionFormats?: readonly ModelPropertiesFromTraits<
    MagdaDistributionFormatTraits
  >[];

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
  const distributions = isJsonObject(aspects.distributions)
    ? aspects.distributions
    : {};

  if (group && group.members) {
    // Represent as a Magda catalog group so that we can load members when
    // the group is opened.
    return {
      id: record.id,
      name: record.name,
      type: "magda-group",
      url: options.magdaBaseUrl,
      groupId: record.id,
      definition: {
        type: terria.type,
        members: group.members,
        // TODO: merge the terria definition with our traits definition, don't just choose one or the other.
        ...(isJsonObject(terria.definition) ? terria.definition : options.definition)
      }
    };
  } else if (terria && terria.type && isJsonObject(terria.definition)) {
    return {
      id: record.id,
      name: record.name,
      type: terria.type,
      ...terria.definition
    };
  } else {
    // Find a suitable definition for this non-Terria dataset.
    // TODO
    return undefined;
  }
}
