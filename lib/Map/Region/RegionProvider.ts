import { Feature } from "@turf/helpers/dist/js/lib/geojson";
import i18next from "i18next";
import { action, makeObservable, observable, runInAction } from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import URI from "urijs";
import CorsProxy from "../../Core/CorsProxy";
import { isFeature } from "../../Core/GeoJson";
import TerriaError from "../../Core/TerriaError";
import isDefined from "../../Core/isDefined";
import loadJson from "../../Core/loadJson";
import loadText from "../../Core/loadText";
import Terria from "../../Models/Terria";
import xml2json from "../../ThirdParty/xml2json";

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
   * Server type (either 'WMS' or 'MVT')
   */
  serverType: string | undefined;

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

  /**
   * URL of WMS server. Needed if the layer is a MVT layer, but the layer is also used for analytics region picker (analytics section uses WMS/WFS)
   */
  analyticsWmsServer?: string;

  /**
   * Name of the layer on the WMS server. Needed if the layer is a MVT layer, but the layer is also used for analytics region picker (analytics section uses WMS/WFS)
   */
  analyticsWmsLayerName?: string;
}

export interface Region {
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
  readonly serverType: string;
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
  readonly regionIdsFile: string | undefined;
  readonly regionDisambigIdsFile: string | undefined;
  readonly analyticsWmsServer: string | undefined;
  readonly analyticsWmsLayerName: string | undefined;

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

  /**
   * Array of names for regions in the same order as regions.
   */
  regionNames: string[] = [];

  get regions() {
    return this._regions;
  }

  /**
   * Look-up table of attributes, for speed.
   */
  private _idIndex: RegionIndex = {};

  /** Cache the loadRegionID promises so they are not regenerated each time
      until this._regions is defined. */
  private _loadRegionIDsPromises: Promise<any>[] | undefined = undefined;

  /** Cache the loadRegionNames promises so they are not regenerated each time */
  private _loadRegionNamesPromise: Promise<any[]> | undefined;

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
    makeObservable(this);
    this.regionType = regionType;
    this.corsProxy = corsProxy;

    this.regionProp = properties.regionProp;
    this.nameProp = properties.nameProp;
    this.description = properties.description;
    this.layerName = properties.layerName;
    this.server = properties.server;
    this.serverType = properties.serverType ?? "MVT";
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

    this.analyticsWmsServer =
      properties.analyticsWmsServer ??
      (this.serverType === "WMS" ? this.server : undefined);

    this.analyticsWmsLayerName =
      properties.analyticsWmsLayerName ??
      (this.serverType === "WMS" ? this.layerName : undefined);
  }

  setDisambigProperties(dp: RegionProvider | undefined) {
    this.disambigDataReplacements = dp?.dataReplacements;
    this.disambigServerReplacements = dp?.serverReplacements;
    this.disambigAliases = dp?.aliases;
  }

  /**
   * Given an entry from the region mapping config, load the IDs that
     correspond to it, and possibly the disambiguation properties.
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
        const loadRegionIds: Promise<unknown> = this.regionIdsFile
          ? loadJson(this.regionIdsFile)
          : loadRegionsFromWfs(this, this.regionProp);

        const loadDisambigIds: Promise<unknown> = this.regionDisambigIdsFile
          ? loadJson(this.regionDisambigIdsFile)
          : this.disambigProp
          ? loadRegionsFromWfs(this, this.disambigProp)
          : Promise.resolve(undefined);

        this._loadRegionIDsPromises = [
          loadRegionIds.then((result: any) => {
            if (Array.isArray(result?.values)) {
              this.processRegionIds(result?.values, false);
            }
          }),
          loadDisambigIds.then((result: any) => {
            if (Array.isArray(result?.values)) {
              this.processRegionIds(result?.values, true);
            }
          })
        ];
      }
      await Promise.all(this._loadRegionIDsPromises);
    } catch (_e) {
      console.log(`Failed to load region IDS for ${this.regionType}`);
    } finally {
      runInAction(() => (this._loaded = true));
    }
  }

  loadRegionNames() {
    if (defined(this._loadRegionNamesPromise)) {
      return this._loadRegionNamesPromise;
    }

    const nameProp = this.nameProp || this.regionProp;

    const baseuri = URI(this.analyticsWmsServer).addQuery({
      service: "wfs",
      version: "2.0",
      request: "getPropertyValue",
      typenames: this.analyticsWmsLayerName
    });

    // get the list of IDs that we will attempt to match against for this column

    let url = baseuri.setQuery("valueReference", nameProp).toString();

    if (this.corsProxy.shouldUseProxy(url)) {
      url = this.corsProxy.getURL(url);
    }

    this._loadRegionNamesPromise = loadText(url).then((xml) => {
      const obj = xml2json(xml);

      if (!defined(obj.member)) {
        const exception = defined(obj.Exception)
          ? "<br/><br/>" + obj.Exception.ExceptionText
          : "";
        throw new TerriaError({
          title: "CSV region mapping",
          message:
            "Couldn't load region names for region type " +
            this.regionType +
            exception
        });
      }

      this.regionNames = obj.member.map((m: any) => m[nameProp]);
      return this.regionNames;
    });

    return this._loadRegionNamesPromise;
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
    const replacements = this[replacementsProp];
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

    const id = this._idIndex[code];
    const idAfterReplacement = this._idIndex[codeAfterReplacement];

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
          "Ambiguous value found in region mapping: " +
            (codeAfterReplacement || code)
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

  /**
   * Finds a region with a given region ID.
   *
   * @param {String} regionID The ID of the region to find.
   * @return {Region} The region, or undefined if no region matching the ID was found.
   */
  findRegionByID(regionID: string | number): Region | undefined {
    if (
      typeof regionID === "string" &&
      typeof this.regions[0]?.regionProp === "number"
    ) {
      regionID = parseInt(regionID, 10);
    } else if (typeof regionID === "string") {
      regionID = regionID.toLowerCase();
      const replacedValue =
        this._appliedReplacements.serverReplacements[regionID];
      if (defined(replacedValue)) {
        regionID = replacedValue;
      }
    }

    return this.regions?.find((region) => region.regionProp === regionID);
  }

  findRegionNameById(regionID: string | number): string | undefined {
    if (
      typeof regionID === "string" &&
      typeof this.regions[0]?.regionProp === "number"
    ) {
      regionID = parseInt(regionID, 10);
    } else if (typeof regionID === "string") {
      regionID = regionID.toLowerCase();
      const replacedValue =
        this._appliedReplacements.serverReplacements[regionID];
      if (defined(replacedValue)) {
        regionID = replacedValue;
      }
    }

    const index = this.regions?.findIndex(
      (region) => region.regionProp === regionID
    );
    const name = this.regionNames[index];
    return name;
  }

  /**
   * Gets the feature associated with a given region.
   * @param terria Terria instance
   * @param regionId The region id
   * @return {Promise} A promise for the GeoJSON feature.
   */
  async getRegionFeature(
    regionId: string | number,
    terria: Terria
  ): Promise<Feature | undefined> {
    let url = this.analyticsWmsServer || this.server;
    if (terria.corsProxy.shouldUseProxy(url)) {
      url = terria.corsProxy.getURL(url);
    }

    url = new URI(url)
      .search("")
      .addQuery({
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typeName: this.layerName,
        outputFormat: "JSON",
        cql_filter: `${this.uniqueIdProp}=${regionId}`
      })
      .toString();

    return loadJson(url).then(function (result) {
      const value = result?.features?.[0];
      const feature = isFeature(value)
        ? { ...value, crs: result?.crs }
        : undefined;
      return feature;
    });
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

/**
 * Fetch a list of region IDs in feature ID (FID) order by querying a WFS server
.
 * This is a slower fall-back method if we don't have a pre-computed JSON list a
vailable.
 * Returns a promise which resolves to an object whose 'values' property can be
used as an argument in processRegionIds.
 * @private
 */
function loadRegionsFromWfs(
  regionProvider: RegionProvider,
  propName: string
): Promise<{ values: (string | number)[] }> {
  if (regionProvider.serverType !== "WMS") {
    throw new DeveloperError(
      "Cannot fetch region ids for region providers that are not WMS"
    );
  }

  const baseuri = URI(regionProvider.server).addQuery({
    service: "wfs",
    version: "2.0",
    request: "getPropertyValue",
    typenames: regionProvider.layerName
  });

  // get the list of IDs that we will attempt to match against for this column
  const url = regionProvider.corsProxy.getURLProxyIfNecessary(
    baseuri.setQuery("valueReference", propName).toString()
  );

  return loadText(url).then(function (xml) {
    const obj = xml2json(xml);

    if (obj.member === undefined) {
      console.log(xml);
      const exception = defined(obj.Exception)
        ? "<br/><br/>" + obj.Exception.ExceptionText
        : "";
      throw new TerriaError({
        title: i18next.t("map.regionProvider.csvRegionMappingTitle"),
        message: i18next.t(
          "map.regionProvider.csvRegionMappingMessageLoadError",
          { regionName: propName, exception: exception }
        )
      });
    }

    if (!(obj.member instanceof Array)) {
      obj.member = [obj.member];
    }
    if (obj.member.length === 1 && !defined(obj.member[0])) {
      throw new TerriaError({
        title: i18next.t("map.regionProvider.csvRegionMappingTitle"),
        message: i18next.t(
          "map.regionProvider.csvRegionMappingMessageZeroBoundariesFound",
          { regionName: propName }
        )
      });
    }
    return {
      values: obj.member.map((m: any) => m[propName])
    };
  });
}
