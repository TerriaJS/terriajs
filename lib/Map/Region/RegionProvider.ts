import { action, observable, runInAction } from "mobx";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CorsProxy from "../../Core/CorsProxy";
import isDefined from "../../Core/isDefined";
import loadJson from "../../Core/loadJson";

/*
Encapsulates one entry in regionMapping.json
Responsibilities:
- communicate with MVT server
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

interface Region {
  fid?: number;
  regionProp?: string | number | undefined;
  regionPropWithServerReplacement?: string | number | undefined;
  disambigProp?: string | number | undefined;
  disambigPropWithServerReplacement?: string | number | undefined;
}
interface RegionIndex {
  [key: string]: number | number[];
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

  private disambigDataReplacements: [string, string, RegExp][] | undefined;
  private disambigServerReplacements: [string, string, RegExp][] | undefined;
  private disambigAliases: string[] | undefined;

  private _appliedReplacements = {
    serverReplacements: {} as any,
    disambigServerReplacements: {} as any,
    dataReplacements: {} as any,
    disambigDataReplacements: {} as any
  };

  /**
   * Array of attributes of each region, once retrieved from the server.
   */
  private _regions: Region[] = [];

  get regions() {
    return this._regions;
  }

  /**
   * Look-up table of attributes, for speed.
   */
  private _idIndex: RegionIndex = {};

  /** Cache the loadRegionID promises so they are not regenerated each time until this._regions is defined. */

  private _loadRegionIDsPromises: Promise<any>[] | undefined = undefined;

  /** Flag to indicate if loadRegionID has finished */
  @observable
  private _loaded = false;

  get loaded() {
    return this._loaded;
  }

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
        ? properties.serverReplacements.map(function (r) {
            return [
              r[0],
              r[1].toLowerCase(),
              new RegExp(r[0].toLowerCase(), "gi")
            ];
          })
        : [];

    this.dataReplacements =
      properties.dataReplacements instanceof Array
        ? properties.dataReplacements.map(function (r) {
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

  setDisambigProperties(dp: RegionProvider | undefined) {
    this.disambigDataReplacements = dp?.dataReplacements;
    this.disambigServerReplacements = dp?.serverReplacements;
    this.disambigAliases = dp?.aliases;
  }

  /**
   * Given an entry from the region mapping config, load the IDs that correspond to it, and possibly the disambiguation properties.
   */
  @action
  async loadRegionIDs() {
    try {
      if (this._regions.length > 0) {
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
        const fetchAndProcess = async (
          idListFile: string,
          disambig: boolean
        ) => {
          if (!isDefined(idListFile)) {
            return;
          }

          this.processRegionIds((await loadJson(idListFile)).values, disambig);
        };
        this._loadRegionIDsPromises = [
          fetchAndProcess(this.regionIdsFile, false),
          fetchAndProcess(this.regionDisambigIdsFile, true)
        ];
      }
      await Promise.all(this._loadRegionIDsPromises);
    } catch (e) {
      console.log(`Failed to load region IDS for ${this.regionType}`);
    } finally {
      runInAction(() => (this._loaded = true));
    }
  }

  /**
   * Returns the region variable of the given name, matching against the aliases provided.
   *
   * @param {string[]} varNames Array of variable names.
   * @returns {string} The name of the first column that matches any of the given aliases.
   */
  findRegionVariable(varNames: string[]) {
    return findVariableForAliases(varNames, [this.regionType, ...this.aliases]);
  }

  /**
   * If a disambiguation column is known for this provider, return a column matching its description.
   *
   * @param {string[]} varNames Array of variable names.
   * @returns {string} The name of the first column that matches any of the given disambiguation aliases.
   */
  findDisambigVariable(varNames: string[]) {
    if (!isDefined(this.disambigAliases) || this.disambigAliases.length === 0) {
      return undefined;
    }
    return findVariableForAliases(varNames, this.disambigAliases);
  }

  /**
   * Given a list of region IDs in feature ID order, apply server replacements if needed, and build the this._regions array.
   * If no propertyName is supplied, also builds this._idIndex (a lookup by attribute for performance).
   * @param {Array} values An array of string or numeric region IDs, eg. [10050, 10110, 10150, ...] or ['2060', '2061', '2062', ...]
   * @param {boolean} disambig True if processing region IDs for disambiguation
   */
  processRegionIds(values: number[] | string[], disambig: boolean) {
    // There is also generally a `layer` and `property` property in this file, which we ignore for now.
    values.forEach((value: string | number | undefined, index: number) => {
      if (!isDefined(this._regions[index])) {
        this._regions[index] = {};
      }

      let valueAfterReplacement = value;

      if (typeof valueAfterReplacement === "string") {
        // we apply server-side replacements while loading. If it ever turns out we need
        // to store the un-regexed version, we should add a line here.
        valueAfterReplacement = this.applyReplacements(
          valueAfterReplacement.toLowerCase(),
          disambig ? "disambigServerReplacements" : "serverReplacements"
        );
      }

      // If disambig IDS - only set this._regions properties - not this._index properties
      if (disambig) {
        this._regions[index].disambigProp = value;
        this._regions[index].disambigPropWithServerReplacement =
          valueAfterReplacement;
      } else {
        this._regions[index].regionProp = value;
        this._regions[index].regionPropWithServerReplacement =
          valueAfterReplacement;

        // store a lookup by attribute, for performance.
        // This is only used for region prop (not disambig prop)
        if (isDefined(value) && isDefined(valueAfterReplacement)) {
          // If value is different after replacement, then also add original value for _index
          if (value !== valueAfterReplacement) {
            this._idIndex[value] = index;
          }
          if (!isDefined(this._idIndex[valueAfterReplacement])) {
            this._idIndex[valueAfterReplacement] = index;
          } else {
            // if we have already seen this value before, store an array of values, not one value.
            if (Array.isArray(this._idIndex[valueAfterReplacement])) {
              (this._idIndex[valueAfterReplacement] as number[]).push(index);
            } else {
              this._idIndex[valueAfterReplacement] = [
                this._idIndex[valueAfterReplacement] as number,
                index
              ];
            }
          }

          // Here we make a big assumption that every region has a unique identifier (probably called FID), that it counts from zero,
          // and that regions are provided in sorted order from FID 0. We do this to avoid having to explicitly request
          // the FID column, which would double the amount of traffic per region dataset.
          // It is needed to simplify reverse lookups from complex matches (regexes and disambigs)
          this._regions[index].fid = index;
        }
      }
    });
  }

  /**
   * Apply an array of regular expression replacements to a string. Also caches the applied replacements in regionProvider._appliedReplacements.
   * @param {String} s The string.
   * @param {String} replacementsProp Name of a property containing [ [ regex, replacement], ... ], where replacement is a string which can contain '$1' etc.
   */

  applyReplacements(
    s: string | number,
    replacementsProp: ReplacementVar
  ): string {
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

    if (this._appliedReplacements[replacementsProp][r] !== undefined) {
      return this._appliedReplacements[replacementsProp][r];
    }

    replacements.forEach(function (rep: any) {
      r = r.replace(rep[2], rep[1]);
    });
    this._appliedReplacements[replacementsProp][s] = r;
    return r;
  }

  /**
   * Given a region code, try to find a region that matches it, using replacements, disambiguation, indexes and other wizardry.
   * @param {string | number} code Code to search for. Falsy codes return -1.
   * @param {string | number | undefined} disambigCode Code to use if disambiguation is necessary
   * @returns {Number} Zero-based index in list of regions if successful, or -1.
   */
  findRegionIndex(
    code: string | number,
    disambigCode: string | number | undefined
  ): number {
    if (!isDefined(code) || code === "") {
      // Note a code of 0 is ok
      return -1;
    }

    const codeAfterReplacement = this.applyReplacements(
      code,
      "dataReplacements"
    );

    let id = this._idIndex[code];
    let idAfterReplacement = this._idIndex[codeAfterReplacement];

    if (!isDefined(id) && !isDefined(idAfterReplacement)) {
      return -1;
    }

    if (typeof id === "number") {
      // found an unambiguous match (without replacement)
      return id;
    } else if (typeof idAfterReplacement === "number") {
      // found an unambiguous match (with replacement)
      return idAfterReplacement;
    } else {
      const ids = id ?? idAfterReplacement; // found an ambiguous match
      if (!isDefined(disambigCode)) {
        // we have an ambiguous value, but nothing with which to disambiguate. We pick the first, warn.
        console.warn(
          "Ambiguous value found in region mapping: " + codeAfterReplacement ??
            code
        );
        return ids[0];
      }

      if (this.disambigProp) {
        const processedDisambigCode = this.applyReplacements(
          disambigCode,
          "disambigDataReplacements"
        );

        // Check out each of the matching IDs to see if the disambiguation field matches the one we have.
        for (let i = 0; i < ids.length; i++) {
          if (
            this._regions[ids[i]].disambigProp === processedDisambigCode ||
            this._regions[ids[i]].disambigPropWithServerReplacement ===
              processedDisambigCode
          ) {
            return ids[i];
          }
        }
      }
    }
    return -1;
  }
}

function findVariableForAliases(varNames: string[], aliases: string[]) {
  // Try first with no transformation (but case-insensitive)
  for (let j = 0; j < aliases.length; j++) {
    const re = new RegExp("^" + aliases[j] + "$", "i");
    for (let i = 0; i < varNames.length; i++) {
      if (re.test(varNames[i])) {
        return varNames[i];
      }
    }
  }

  // Now try without whitespace, hyphens and underscores
  for (let j = 0; j < aliases.length; j++) {
    const aliasNoWhiteSpace = aliases[j].replace(/[-_\s]/g, "");
    const re = new RegExp("^" + aliasNoWhiteSpace + "$", "i");
    for (let i = 0; i < varNames.length; i++) {
      const varNameNoWhiteSpace = varNames[i].replace(/[-_\s]/g, "");
      if (re.test(varNameNoWhiteSpace)) {
        return varNames[i];
      }
    }
  }

  return undefined;
}
