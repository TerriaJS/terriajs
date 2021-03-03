import i18next from "i18next";
import { flatten } from "lodash-es";
import { computed, runInAction, action } from "mobx";
import URI from "urijs";
import loadXML from "../Core/loadXML";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import xml2json from "../ThirdParty/xml2json";
import CswCatalogGroupTraits from "../Traits/CswCatalogGroupTraits";
import ModelReference from "../Traits/ModelReference";
import CreateModel from "./CreateModel";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import { BoundingBox } from "./OwsInterfaces";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import loadWithXhr from "../Core/loadWithXhr";
import isDefined from "../Core/isDefined";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";

const defaultGetRecordsTemplate = require("./CswGetRecordsTemplate.xml");
const wpsGetRecordsTemplate = require("./CswGetRecordsWPSTemplate.xml");

// Source files:
// http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd
// http://schemas.opengis.net/csw/2.0.2/CSW-publication.xsd
// http://schemas.opengis.net/csw/2.0.2/csw.xsd
// http://schemas.opengis.net/csw/2.0.2/record.xsd
export type Record = SummaryRecord | FullRecord;

export type Records = SummaryRecord[] | FullRecord[];

type ArrayOrPrimitive<T> = T | T[];
function toArray<T>(val: ArrayOrPrimitive<T>): T[] | undefined {
  if (!isDefined(val)) return undefined;
  return Array.isArray(val) ? val : [val];
}

export interface BriefRecord {
  BoundingBox?: BoundingBox[];
  identifier: string[];
  title: string[];
  type?: string;
}

export interface SummaryRecord extends BriefRecord {
  abstract?: string[];
  format?: string[];
  modified?: string[];
  relation?: string[];
  spatial?: string[];
  subject?: string[];
  references?: (String & {
    scheme?: string;
    protocol?: string;
    description?: string;
    name?: string;
  })[];
  URI?: (String & {
    scheme?: string;
    protocol?: string;
    description?: string;
    name?: string;
  })[];
}
export interface FullRecord extends SummaryRecord {
  contributor?: string;
  creator?: string;
  language?: string;
  publisher?: string;
  source?: string;
}

export interface DomainValuesType {
  type: string;
  uom?: string;
  ConceptualScheme?: {
    Authority: string;
    Document: string;
    Name: string;
  };
  ListOfValues?: { Value: ArrayOrPrimitive<any> };
  ParameterName: string;
  PropertyName: string;
  RangeOfValues?: {
    MaxValue: any;
    MinValue: any;
  };
}

/** Returns the actual values for some property. In general this is a
 * subset of the value domain (that is, set of permissible values),
 * although in some cases these may be the same. */
export interface GetDomainResponseType {
  DomainValues: ArrayOrPrimitive<DomainValuesType>;
}

export interface SearchResultsType {
  /** The element set that has been returned (i.e., "brief", "summary", "full") are defined in an application profile. */
  elementSet?: "brief" | "summary" | "full";
  expires?: Date;
  /** position of next record in the result set (0 if no records remain) */
  nextRecord?: number;
  /** number of records matched by the query */
  numberOfRecordsMatched: number;
  /** number of records returned to client */
  numberOfRecordsReturned: number;
  recordSchema?: string;
  resultSetId?: string;
  Record?: Records;
}

export interface GetRecordsResponse {
  version?: string;
  RequestId?: string;
  SearchResults: SearchResultsType;
  SearchStatus: {
    timestamp?: Date;
  };
  Exception?: any;
}

export interface GetRecordByIdResponse {
  Record?: Record;
}
export interface MetadataGroup {
  field: string | undefined;
  value: string;
  regex: boolean;
  group: string;
  children: MetadataGroup[];
}
class CswStratum extends LoadableStratum(CswCatalogGroupTraits) {
  static stratumName = "CswStratum";
  static async load(catalogGroup: CswCatalogGroup): Promise<CswStratum> {
    if (catalogGroup.url === undefined) {
      throw new TerriaError({
        title: i18next.t("models.CswCatalogGroup.missingUrlTitle"),
        message: i18next.t("models.CswCatalogGroup.missingUrlMessage")
      });
    }

    if (catalogGroup.domainSpecification.hierarchySeparator === undefined) {
      throw new TerriaError({
        title: i18next.t(
          "models.CswCatalogGroup.missingHierarchySeparatorTitle"
        ),
        message: i18next.t(
          "models.CswCatalogGroup.missingHierarchySeparatorMessage"
        )
      });
    }

    // Call GetDomain (contains a list of all items)

    const getDomainUrl = new URI(
      proxyCatalogItemUrl(catalogGroup, catalogGroup.url)
    ).query({
      service: "CSW",
      version: "2.0.2",
      request: "GetDomain",
      propertyname: catalogGroup.domainSpecification.domainPropertyName
    });

    let domainResponse: GetDomainResponseType | undefined;
    try {
      const xml = await loadXML(getDomainUrl.toString());

      if (
        !xml ||
        !xml.documentElement ||
        xml.documentElement.localName !== "GetDomainResponse"
      ) {
        throw `Invalid XML response`;
      }

      domainResponse = xml2json(xml) as GetDomainResponseType;
    } catch (error) {
      console.log(error);
      throw new TerriaError({
        sender: catalogGroup,
        title: i18next.t("models.csw.notUseableTitle"),
        message:
          i18next.t("models.csw.notUseableMessage") +
          '<a href="mailto:' +
          catalogGroup.terria.supportEmail +
          '">' +
          catalogGroup.terria.supportEmail +
          "</a>."
      });
    }

    if (!domainResponse) {
      throw new TerriaError({
        sender: catalogGroup,
        title: i18next.t("models.csw.errorLoadingTitle"),
        message: i18next.t("models.csw.checkCORSDomain", {
          cors:
            '<a href="http://enable-cors.org/" target="_blank">' +
            i18next.t("models.csw.cors") +
            "</a>",
          email:
            '<a href="mailto:' +
            catalogGroup.terria.supportEmail +
            '">' +
            catalogGroup.terria.supportEmail +
            "</a>."
        })
      });
    }

    const metadataGroups: MetadataGroup[] = [];

    // Get list of items
    const listOfValues: string[] = flatten(
      toArray(domainResponse.DomainValues)?.map(d =>
        toArray(d?.ListOfValues?.Value)
      )
    ).filter(v => typeof v === "string");

    listOfValues.forEach(value => {
      const keys = value.split(
        catalogGroup.domainSpecification.hierarchySeparator!
      );
      // recursively find the group that the last key in keys should belong to and add that key
      addMetadataGroups(
        keys,
        0,
        metadataGroups,
        catalogGroup.domainSpecification.hierarchySeparator!,
        catalogGroup.domainSpecification.queryPropertyName
      );
    });

    // Get Records

    let pageing = true;
    let startPosition = 1;

    const records: Records = [];

    // We have to paginate through Records
    while (pageing) {
      const postData = defaultGetRecordsTemplate.replace(
        "{startPosition}",
        startPosition
      );

      const xml = await loadWithXhr({
        url: proxyCatalogItemUrl(
          catalogGroup,
          new URI(catalogGroup.url).query("").toString(),
          "1d"
        ),
        responseType: "document",
        method: "POST",
        overrideMimeType: "text/xml",
        data: postData,
        headers: {
          "Content-Type": "application/xml"
        }
      });

      if (!isDefined(xml)) {
        throw new TerriaError({
          sender: catalogGroup,
          title: i18next.t("models.csw.errorLoadingRecordsTitle"),
          message:
            i18next.t("models.csw.errorLoadingRecordsMessage") +
            '<a href="mailto:' +
            catalogGroup.terria.supportEmail +
            '">' +
            catalogGroup.terria.supportEmail +
            "</a>."
        });
      }

      const json = xml2json(xml) as GetRecordsResponse;

      if (json.Exception) {
        let errorMessage = i18next.t("models.csw.unknownError");
        if (json.Exception.ExceptionText) {
          errorMessage = i18next.t("models.csw.exceptionMessage", {
            exceptionText: json.Exception.ExceptionText
          });
        }
        throw new TerriaError({
          sender: catalogGroup,
          title: i18next.t("models.csw.errorLoadingTitle"),
          message: errorMessage
        });
      }

      records.push(...(json?.SearchResults?.Record ?? []));

      const nextRecord = json?.SearchResults?.nextRecord;
      if (
        !isDefined(nextRecord) ||
        nextRecord === 0 ||
        nextRecord >= json?.SearchResults?.numberOfRecordsMatched
      ) {
        pageing = false;
      } else {
        startPosition = nextRecord;
      }
    }

    return new CswStratum(
      catalogGroup,
      domainResponse,
      metadataGroups,
      records
    );
  }

  constructor(
    readonly catalogGroup: CswCatalogGroup,
    readonly domain: GetDomainResponseType,
    readonly metadataGroups: MetadataGroup[],
    readonly records: Records
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new CswStratum(
      model as CswCatalogGroup,
      this.domain,
      this.metadataGroups,
      this.records
    ) as this;
  }

  @computed
  get members(): ModelReference[] {
    return [];
    // return filterOutUnisDefined(
    //   this.topLevelLayers.map(layer => this.getLayerId(layer))
    // );
  }

  @action
  createMembersFromLayers() {
    //     this.records.forEach(record => {
    //   var uris = toArray(record.URI ?? record.references)
    //   if (!isDefined(uris)) {
    //     return;
    //   }
    //   // maybe more than one url that results in a data layer here - so check for
    //   // the acceptable ones, store the others as downloadUrls that can be
    //   // displayed in the metadata summary for the layer
    // const downloadUrls: {url:string, description?:string}[] = [];
    // const acceptableUrls: string[]  = [];
    // let legendUrl: string | undefined = undefined;
    //   for (var m = 0; m < uris.length; m++) {
    //     var url = uris[m];
    //     if (!url) return
    //     var excludedProtocol = false;
    //     for (var l = 0; l < resourceFormats.length; l++) {
    //       var f = resourceFormats[l];
    //       var protocolOrScheme = url.protocol ?? url.scheme;
    //       if (protocolOrScheme && protocolOrScheme.match(that[f[0]])) {
    //         excludedProtocol = true;
    //         acceptableUrls.push(url.toString());
    //       }
    //     }
    //     if (!excludedProtocol) {
    //       if (url?.description === "LegendUrl") {
    //         legendUrl = url.toString();
    //       }
    //       downloadUrls.push({
    //         url: url.toString(),
    //         description: url.description ? url.description : url.name
    //       });
    //     }
    //   }
    //   // Now process the list of acceptable urls and hand the metadata
    //   // record and the downloadUrls to each data layer item we create
    //   for (var j = 0; j < acceptableUrls.length; ++j) {
    //     var uri = acceptableUrls[j];
    //     var group = that;
    //     if (this.metadataGroups.length > 0) {
    //       group = findGroup(that, that.metadataGroups, record);
    //     }
    //     if (defined(group)) {
    //       var catalogItem = createItemForUri(
    //         that,
    //         record,
    //         uri,
    //         downloadUrls,
    //         legendUrl
    //       );
    //       if (defined(catalogItem)) {
    //         group.items.push(catalogItem);
    //       }
    //     } else {
    //       //console.log("Failed to find a group match for "+JSON.stringify(record));
    //     }
    //     }
    //   }
    // @action
    // createMemberFromLayer(layer: CapabilitiesLayer) {
    //   const layerId = this.getLayerId(layer);
    //   if (!layerId) {
    //     return;
    //   }
    //   // If has nested layers -> create model for CatalogGroup
    //   if (layer.Layer) {
    //     // Create nested layers
    //     let members: CapabilitiesLayer[] = [];
    //     if (Array.isArray(layer.Layer)) {
    //       members = layer.Layer;
    //     } else {
    //       members = [layer.Layer as CapabilitiesLayer];
    //     }
    //     members.forEach(member => this.createMemberFromLayer(member));
    //     // Create group
    //     const existingModel = this.catalogGroup.terria.getModelById(
    //       CatalogGroup,
    //       layerId
    //     );
    //     let model: CatalogGroup;
    //     if (existingModel === undefined) {
    //       model = new CatalogGroup(layerId, this.catalogGroup.terria);
    //       this.catalogGroup.terria.addModel(model);
    //     } else {
    //       model = existingModel;
    //     }
    //     // Replace the stratum inherited from the parent group.
    //     const stratum = CommonStrata.underride;
    //     model.strata.delete(stratum);
    //     model.setTrait(CommonStrata.underride, "name", layer.Title);
    //     return;
    //   }
    //   // No nested layers -> create model for CswCatalogItem
    //   const existingModel = this.catalogGroup.terria.getModelById(
    //     CswCatalogItem,
    //     layerId
    //   );
    //   let model: CswCatalogItem;
    //   if (existingModel === undefined) {
    //     model = new CswCatalogItem(layerId, this.catalogGroup.terria);
    //     this.catalogGroup.terria.addModel(model);
    //   } else {
    //     model = existingModel;
    //   }
    //   // Replace the stratum inherited from the parent group.
    //   const stratum = CommonStrata.underride;
    //   model.strata.delete(stratum);
    //   model.setTrait(stratum, "name", layer.Title);
    //   model.setTrait(stratum, "url", this.catalogGroup.url);
    // }
  }
}

export default class CswCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(CswCatalogGroupTraits)))
) {
  static readonly type = "csw-group";

  get type() {
    return CswCatalogGroup.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (this.strata.get(CswStratum.name) !== undefined) return;
    const stratum = await CswStratum.load(this);
    runInAction(() => {
      this.strata.set(CswStratum.name, stratum);
    });
  }

  protected async forceLoadMembers(): Promise<void> {
    await this.loadMetadata();
    const cswStratum = <CswStratum | undefined>this.strata.get(CswStratum.name);
    if (cswStratum) {
      // cswStratum.createMembersFromLayers();
    }
  }
}

function addMetadataGroups(
  keys: string[],
  index: number,
  group: MetadataGroup[],
  separator: string,
  queryField: string | undefined
) {
  if (index > keys.length - 1) return;

  let groupIndex = group.findIndex(g => g.group === keys[index]);

  if (groupIndex === -1) {
    // not found so add it
    let value: string;
    let regex = true;
    // if we aren't at the last key, use a regex and tack on another separator to avoid mismatches
    if (index + 1 !== keys.length) {
      const sepRegex = separator.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      value = "^" + keys.slice(0, index + 1).join(sepRegex) + sepRegex;
    } else {
      value = keys.slice(0, index + 1).join(separator);
      regex = false;
    }

    group.push({
      field: queryField,
      value: value,
      regex: regex,
      group: keys[index],
      children: []
    });
    groupIndex = group.length - 1;
  }
  addMetadataGroups(
    keys,
    index + 1,
    group[groupIndex].children,
    separator,
    queryField
  );
}

StratumOrder.addLoadStratum(CswStratum.stratumName);

// // find groups that the record belongs to and create any that don't exist already
// function findGroup(catalogGroup, keywordsGroups, record: Record) {
//   for (var i = 0; i < keywordsGroups.length; i++) {
//     var kg = keywordsGroups[i];
//     var fields = record[kg.field];
//     var matched = false;
//     if (isDefined(fields)) {
//       if (fields instanceof String || typeof fields === "string") {
//         fields = [fields];
//       }
//       for (var j = 0; j < fields.length; j++) {
//         var field = fields[j];
//         if (matchValue(kg.value, field, kg.regex)) {
//           matched = true;
//           break;
//         }
//       }
//     }
//     if (matched) {
//       var newGroup = addGroupIfNotAlreadyPresent(
//         kg.group ? kg.group : kg.value,
//         catalogGroup
//       );
//       if (kg.children && isDefined(newGroup)) {
//         // recurse to see if it fits into any of the children
//         catalogGroup = findGroup(newGroup, kg.children, record);
//         if (!isDefined(catalogGroup)) {
//           //console.log("No match in children for record "+record.title+"::"+record.subject+"::"+record.title+", will assign to "+newGroup.name);
//           catalogGroup = newGroup;
//         }
//       } else if (isDefined(newGroup)) {
//         catalogGroup = newGroup;
//       }
//       return catalogGroup;
//     }
//   }
// }

// function matchValue(value: string, recordValue: string, regex?: boolean) {
//   if (isDefined(regex) && regex) {
//     // regular expression so parse it and check string against it
//     var regExp = new RegExp(value);
//     return regExp.test(recordValue);
//   } else {
//     return value === recordValue;
//   }
// }

// function addGroupIfNotAlreadyPresent(name: string, catalogGroup) {
//   var item = catalogGroup.findFirstItemByName(name);
//   if (!isDefined(item)) {
//     item = new CatalogGroup(catalogGroup.terria);
//     item.name = name;
//     catalogGroup.items.push(item);
//   }
//   return item;
// }
