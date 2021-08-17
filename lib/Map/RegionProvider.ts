import URI from "urijs";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import CorsProxy from "../Core/CorsProxy";
import loadJson from "../Core/loadJson";
import loadText from "../Core/loadText";
import xml2json from "../ThirdParty/xml2json";
import TerriaError from "../Core/TerriaError";
import i18next from "i18next";
import isDefined from "../Core/isDefined";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import Terria from "../Models/Terria";

/*
Encapsulates one entry in regionMapping.json
Responsibilities:
- communicate with WFS or MVT server
- provide region IDs for a given region type
- determine whether a given column name matches
- identify region and disambiguation columns
- provide a lookup function for a given column of data
*/

type ReplacementVar =
  | "dataReplacements"
  | "serverReplacements"
  | "disambigDataReplacements"
  | "disambigServerReplacements";

export interface RegionProvierOptions {
  /**
   * Feature attribute whose value will correspond to each region's code.
   */
  regionProp: string;
  /**
   * Feature attribute whose value can be used as a user-facing name for the region.  If this property is undefined, the regions
   * do not have names.
   */
  nameProp: string;
  /**
   * A text description of this region type, which may feature in the user interface.
   */
  description: string;

  /**
   * Name of the MVT layer where these regions are found.
   */
  layerName: string;

  /**
   * URL of the MVT server
   */
  server: string;

  /**
   * List of subdomains for requests to be sent to (only defined for MVT providers)
   */
  serverSubdomains: string[] | undefined;

  /**
   * Minimum zoom which the server serves tiles at
   */
  serverMinZoom: number;

  /**
   * Maximum zoom which the maximum native zoom tiles can be rendered at
   */
  serverMaxZoom: number;

  /**
   * Maximum zoom which the server serves tiles at
   */
  serverMaxNativeZoom: number;

  /**
   * Bounding box of vector geometry [w,s,e,n] (only defined for MVT providers)
   */
  bbox: number[] | undefined;

  /**
   * List of aliases which will be matched against if found as column headings.
   */
  aliases: string[];

  /**
   * Array of [regex, replacement] arrays which will be applied to each ID element on the server side before matching
   * is attempted. For example, [ [ ' \(.\)$' ], '' ] will convert 'Baw Baw (S)' to 'Baw Baw'
   */
  serverReplacements: [string, string][];

  /**
   * Array of [regex, replacement] arrays which will be applied to each user-provided ID element before matching
   * is attempted. For example, [ [ ' \(.\)$' ], '' ] will convert 'Baw Baw (S)' to 'Baw Baw'
   */

  dataReplacements: [string, string][];

  /** The property within the same WFS region that can be used for disambiguation. */
  disambigProp: string | undefined;

  /**
   * Returns the name of a field which uniquely identifies each region. This field is not necessarily used for matching, or
   * of interest to the user, but is needed for reverse lookups. This field must count from zero, and features must be
   * returned in sorted order.
   */
  uniqueIdProp: string;

  /**
   * Whether this region type uses text codes, rather than numeric. It matters because numeric codes are treated differently by the
   * CSV handling models.
   */
  textCodes: boolean;

  /**
   * The URL of a pre-generated JSON file containing just a long list of IDs for a given
   * layer attribute, in the order of ascending feature IDs (fids). If defined, it will
   * be used in preference to requesting those attributes from the WFS server.
   */
  regionIdsFile: string;

  /**
   * JSON file for disambiguation attribute, as per regionIdsFile.
   */
  regionDisambigIdsFile: string;
}

export default class RegionProvider {
  readonly corsProxy: CorsProxy;
  readonly regionType: string;
  readonly regionProp: string;
  readonly nameProp: string;
  readonly description: string;
  readonly layerName: string;
  readonly server: string;
  readonly serverSubdomains: string[] | undefined;
  readonly serverMinZoom: number;
  readonly serverMaxZoom: number;
  readonly serverMaxNativeZoom: number;
  readonly bbox: number[] | undefined;
  readonly aliases: string[];
  readonly serverReplacements: [string, string, RegExp][];
  readonly dataReplacements: [string, string, RegExp][];
  readonly disambigProp: string | undefined;
  readonly uniqueIdProp: string;
  readonly textCodes: boolean;
  readonly regionIdsFile: string;
  readonly regionDisambigIdsFile: string;

  /**
   * Array of attributes of each region, once retrieved from the server.
   */
  regions: { [key: string]: string | number | undefined }[] = [];

  /**
   * Look-up table of attributes, for speed.
   */
  private _idIndex: any = {};

  disambigDataReplacements: [string, string, RegExp][] | undefined;
  disambigServerReplacements: [string, string, RegExp][] | undefined;
  disambigAliases: string[] | undefined;

  private _appliedReplacements = {
    serverReplacements: {},
    dataReplacements: {},
    disambigDataReplacements: {}
  };

  // Cache the loadRegionID promises so they are not regenerated each time until this.regions is defined.
  private _loadRegionIDsPromises: Promise<any>[] | undefined = undefined;

  constructor(
    regionType: string,
    properties: RegionProvierOptions,
    corsProxy: CorsProxy
  ) {
    this.regionType = regionType;
    this.corsProxy = corsProxy;

    this.regionProp = properties.regionProp;
    this.nameProp = properties.nameProp;
    this.description = properties.description;
    this.layerName = properties.layerName;
    this.server = properties.server;
    this.serverSubdomains = properties.serverSubdomains;
    this.serverMinZoom = defaultValue(properties.serverMinZoom, 0);
    this.serverMaxZoom = defaultValue(properties.serverMaxZoom, Infinity);
    this.serverMaxNativeZoom = defaultValue(
      properties.serverMaxNativeZoom,
      this.serverMaxZoom
    );
    this.bbox = properties.bbox;
    this.aliases = defaultValue(properties.aliases, [this.regionType]);
    this.serverReplacements =
      properties.serverReplacements instanceof Array
        ? properties.serverReplacements.map(function(r) {
            return [
              r[0],
              r[1].toLowerCase(),
              new RegExp(r[0].toLowerCase(), "gi")
            ];
          })
        : [];

    this.dataReplacements =
      properties.dataReplacements instanceof Array
        ? properties.dataReplacements.map(function(r) {
            return [
              r[0],
              r[1].toLowerCase(),
              new RegExp(r[0].toLowerCase(), "gi")
            ];
          })
        : [];

    this.disambigProp = properties.disambigProp;

    this.uniqueIdProp = defaultValue(properties.uniqueIdProp, "FID");

    this.textCodes = defaultValue(properties.textCodes, false); // yes, it's singular...

    this.regionIdsFile = properties.regionIdsFile;
    this.regionDisambigIdsFile = properties.regionDisambigIdsFile;
  }

  /**
The flow:

1. CsvCatalogItem wants to check for region mapping, DataTable.checkForRegionVariable
2. which calls RegionProviderList on regionmapping.json
3. RPL loads all RPs, then provides cross references to dab providers
4. CSVCI calls RPL.getRegionDetails, which asks each RP to identify a region variable
5. Based on response, it assigns RP to the right variable, sets this.selected.region.
*/
  setDisambigProperties(dp: RegionProvider | undefined) {
    this.disambigDataReplacements = dp?.dataReplacements;
    this.disambigServerReplacements = dp?.serverReplacements;
    this.disambigAliases = dp?.aliases;
  }

  /**
   * Given an entry from the region mapping config, load the IDs that correspond to it, and possibly to disambiguation properties.
   *
   * @return Promise with no return value.
   */
  async loadRegionIDs() {
    if (this.regions.length > 0) {
      return; // already loaded, so return insta-promise.
    }
    if (this.server === undefined) {
      // technically this may not be a problem yet, but it will be when we want to actually fetch tiles.
      throw new DeveloperError(
        "No server for region mapping defined: " + this.regionType
      );
    }
    // Check for a pre-calculated promise (which may not have resolved yet), and returned that if it exists.
    if (!isDefined(this._loadRegionIDsPromises)) {
      this._loadRegionIDsPromises = [
        this.fetchAndProcess(
          this.regionIdsFile,
          this.regionProp,
          undefined,
          "serverReplacements"
        ),
        this.fetchAndProcess(
          this.regionDisambigIdsFile,
          this.disambigProp,
          this.disambigProp,
          "disambigServerReplacements"
        )
      ];
    }
    return Promise.all(this._loadRegionIDsPromises);
  }

  async fetchAndProcess(
    idListFile: string,
    idProp: string | undefined,
    propertyName: string | undefined,
    replacementsVar: ReplacementVar
  ) {
    if (!isDefined(idListFile) && !isDefined(idProp)) {
      return;
    }
    let json = await loadJson(idListFile);

    this.processRegionIds(json.values, propertyName, replacementsVar);
  }

  /**
   * Maps this.regions to indices into the provided regionArray.
   * Eg. If regionArray = ['Vic', 'Qld', 'NSW'], and this.regions = ['NSW', 'Vic', 'Qld', 'WA'], then returns [2, 0, 1, undefined].
   *
   * @param {Array} regionArray An array of the regions (eg. the column of State values from a csv file). Could be Strings or Numbers.
   * @param {Array} [disambigValues] An array of disambiguating names/numbers for when regions alone are insufficient. Could be Strings or Numbers.
   * @param {Array} [failedMatches] An optional empty array. If provided, indices of failed matches are appended to the array.
   * @param {Array} [ambiguousMatches] An optional empty array. If provided, indices of matches which duplicate prior matches are appended to the array.
   *                (Eg. these are not relevant if at different times.)
   * @param {TimeInterval[]} [timeIntervals] The time intervals during which each value in `regionArray` applies.  If undefined, the data is not
   *                         time-varying.
   * @param {JulianDate} [time] The time at which to do the mapping.  If undefined, the data is not time-varying.
   * @return {Array} Indices into this.region.
   */
  mapRegionsToIndicesInto(
    regionArray: readonly string[] | number[],
    disambigValues?: string[] | number[],
    failedMatches?: number[] | undefined,
    ambiguousMatches?: number[] | undefined,
    timeIntervals?: TimeInterval[] | undefined,
    time?: JulianDate | undefined
  ) {
    if (this.regions.length < 1) {
      throw new DeveloperError(
        "Region provider is not ready to match regions."
      );
    }
    if (!isDefined(disambigValues)) {
      disambigValues = []; // so that disambigValues[i] is undefined, not an error.
    }

    var result = new Array(this.regions.length);
    for (var i = 0; i < regionArray.length; i++) {
      if (!isDefined(regionArray[i])) {
        // Skip over undefined or null values
        continue;
      }

      // Is this row applicable at this time?
      if (isDefined(timeIntervals) && isDefined(time)) {
        var interval = timeIntervals![i];
        if (!isDefined(interval)) {
          // Row is not applicable at any time.
          continue;
        }
        if (!TimeInterval.contains(interval, time!)) {
          // Row is not applicable at this time.
          continue;
        }
      }

      var index = this.findRegionIndex(regionArray[i], disambigValues[i]);
      if (index < 0) {
        if (isDefined(failedMatches)) {
          failedMatches.push(i);
        }
        continue;
      }
      if (isDefined(result[index])) {
        // This region already has a value. In a time-varying dataset, intervals may
        // overlap at their endpoints (i.e. the end of one interval is the start of the next).
        // In that case, we want the later interval to apply.
        if (isDefined(timeIntervals) && isDefined(time)) {
          var existingInterval = timeIntervals![result[index]];
          var newInterval = timeIntervals![i];
          if (
            JulianDate.greaterThan(newInterval.start, existingInterval.start)
          ) {
            // Use the current row as the value.
            result[index] = i;
            continue;
          } else if (
            JulianDate.lessThan(newInterval.start, existingInterval.start)
          ) {
            // Use the existing row as the value.
            continue;
          } else {
            // The two rows have the same start date, so treat this as an ambiguous match.
          }
        }

        if (isDefined(ambiguousMatches)) {
          ambiguousMatches.push(i);
        }
        continue;
      }

      result[index] = i;
    }
    return result;
  }

  /**
   * Returns the region variable of the given name, matching against the aliases provided.
   *
   * @param {String} varNames Array of variable names.
   * @returns {String} The name of the first column that matches any of the given aliases.
   */
  findRegionVariable(varNames: string[]) {
    return findVariableForAliases(varNames, [this.regionType, ...this.aliases]);
  }

  /**
   * If a disambiguation column is known for this provider, return a column matching its description.
   *
   * @param {String} varNames Array of variable names.
   * @returns {String} The name of the first column that matches any of the given disambiguation aliases.
   */
  findDisambigVariable(varNames: string[]) {
    if (!isDefined(this.disambigAliases) || this.disambigAliases.length === 0) {
      return undefined;
    }
    return findVariableForAliases(varNames, this.disambigAliases);
  }

  /**
   * Given a list of region IDs in feature ID order, apply server replacements if needed, and build the this.regions array.
   * If no propertyName is supplied, also builds this._idIndex (a lookup by attribute for performance).
   * @private
   * @param {RegionProvider} regionProvider The RegionProvider instance.
   * @param {Array} values An array of string or numeric region IDs, eg. [10050, 10110, 10150, ...] or ['2060', '2061', '2062', ...]
   * @param {String} [propertyName] The property on that.regions elements, on which to save the id. Defaults to 'id'.
   * @param {String} replacementsProp Used as the second argument in a call to applyReplacements.
   */
  processRegionIds(
    values: number[] | string[],
    propertyName: string | undefined,
    replacementsProp: ReplacementVar
  ) {
    const isDisambiguation = isDefined(propertyName);

    if (!isDefined(propertyName)) {
      propertyName = "id";
    }
    // There is also generally a `layer` and `property` property in this file, which we ignore for now.
    values.forEach((value: string | number | undefined, index: number) => {
      if (!isDefined(this.regions[index])) {
        this.regions[index] = {};
      }

      if (typeof value === "string") {
        value = value.toLowerCase();
        // we apply server-side replacements while loading. If it ever turns out we need
        // to store the un-regexed version, we should add a line here.
        value = this.applyReplacements(value, replacementsProp);
      }

      this.regions[index][propertyName!] = value;

      // store a lookup by attribute, for performance.
      if (!isDisambiguation && isDefined(value)) {
        if (!isDefined(this._idIndex[value])) {
          this._idIndex[value] = index;
        } else {
          // if we have already seen this value before, store an array of values, not one value.
          if (typeof this._idIndex[value] === "object" /* meaning, array */) {
            this._idIndex[value].push(index);
          } else {
            this._idIndex[value] = [this._idIndex[value], index];
          }
        }

        // Here we make a big assumption that every region has a unique identifier (probably called FID), that it counts from zero,
        // and that regions are provided in sorted order from FID 0. We do this to avoid having to explicitly request
        // the FID column, which would double the amount of traffic per region dataset.
        // It is needed to simplify reverse lookups from complex matches (regexes and disambigs)
        this.regions[index][this.uniqueIdProp] = index;
      } // else nothing, we don't maintain an index of disambiguation values (it wouldn't be helpful)
    });
  }

  /**
   * Apply an array of regular expression replacements to a string. Also caches the applied replacements in regionProvider._appliedReplacements.
   * @private
   * @param {RegionProvider} regionProvider The RegionProvider instance.
   * @param {String} s The string.
   * @param {String} replacementsProp Name of a property containing [ [ regex, replacement], ... ], where replacement is a string which can contain '$1' etc.
   */

  applyReplacements(
    s: string | number,
    replacementsProp: ReplacementVar
  ): string | undefined {
    if (!isDefined(s)) {
      return undefined;
    }
    let r: string;
    if (typeof s === "number") {
      r = String(s);
    } else {
      r = s.toLowerCase().trim();
    }
    let replacements = this[replacementsProp];
    if (replacements === undefined || replacements.length === 0) {
      return r;
    }

    if ((this._appliedReplacements as any)[replacementsProp][r] !== undefined) {
      return (this._appliedReplacements as any)[replacementsProp][r];
    }

    replacements.forEach(function(rep: any) {
      r = r.replace(rep[2], rep[1]);
    });
    (this._appliedReplacements as any)[replacementsProp][s] = r;
    return r;
  }

  /**
   * Given a region code, try to find a region that matches it, using replacements, disambiguation, indexes and other wizardry.
   * @private
   * @param {RegionProvider} regionProvider The RegionProvider instance.
   * @param {String} code Code to search for. Falsy codes return -1.
   * @returns {Number} Zero-based index in list of regions if successful, or -1.
   */
  findRegionIndex(
    code: string | number,
    disambigCode: string | number
  ): number {
    if (!isDefined(code) || code === "") {
      // Note a code of 0 is ok
      return -1;
    }
    var processedCode = this.applyReplacements(code, "dataReplacements");
    if (!isDefined(processedCode)) return -1;
    var id = this._idIndex[processedCode];
    if (!isDefined(id)) {
      // didn't find anything
      return -1;
    } else if (typeof id === "number") {
      // found an unambiguous match
      return id;
    } else {
      var ids = id; // found an ambiguous match
      if (!isDefined(disambigCode)) {
        // we have an ambiguous value, but nothing with which to disambiguate. We pick the first, warn.
        console.warn(
          "Ambiguous value found in region mapping: " + processedCode
        );
        return ids[0];
      }

      if (this.disambigProp) {
        var processedDisambigCode = this.applyReplacements(
          disambigCode,
          "disambigDataReplacements"
        );

        // Check out each of the matching IDs to see if the disambiguation field matches the one we have.
        for (var i = 0; i < ids.length; i++) {
          if (
            this.regions[ids[i]][this.disambigProp] === processedDisambigCode
          ) {
            return ids[i];
          }
        }
      }
    }
    return -1;
  }
}

/**
 * Function interface for matching a URL to a {@link CatalogMember} constructor
 * for that URL.
 * @private
 * @callback RegionProvider~colorFunction
 * @param {Number} value The value for this region.
 * @returns {Number[]} Returns a colorArray in the form [r, g, b, a].
 */

function findVariableForAliases(varNames: string[], aliases: string[]) {
  for (var j = 0; j < aliases.length; j++) {
    var re = new RegExp("^" + aliases[j] + "$", "i");
    for (var i = 0; i < varNames.length; i++) {
      if (re.test(varNames[i])) {
        return varNames[i];
      }
    }
  }
  return undefined;
}
