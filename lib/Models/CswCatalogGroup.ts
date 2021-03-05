import i18next from "i18next";
import { flatten } from "lodash-es";
import { action, computed, runInAction } from "mobx";
import URI from "urijs";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import loadWithXhr from "../Core/loadWithXhr";
import loadXML from "../Core/loadXML";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import xml2json from "../ThirdParty/xml2json";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import CswCatalogGroupTraits, {
  QueryPropertyName
} from "../Traits/CswCatalogGroupTraits";
import ModelReference from "../Traits/ModelReference";
import ArcGisMapServerCatalogItem from "./ArcGisMapServerCatalogItem";
import CatalogGroup from "./CatalogGroupNew";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import CsvCatalogItem from "./CsvCatalogItem";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import KmlCatalogItem from "./KmlCatalogItem";
import LoadableStratum from "./LoadableStratum";
import { BaseModel, ModelConstructor } from "./Model";
import { BoundingBox } from "./OwsInterfaces";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";

const defaultGetRecordsTemplate = require("./CswGetRecordsTemplate.xml");
const wpsGetRecordsTemplate = require("./CswGetRecordsWPSTemplate.xml");

// Source files:
// http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd
// http://schemas.opengis.net/csw/2.0.2/CSW-publication.xsd
// http://schemas.opengis.net/csw/2.0.2/csw.xsd
// http://schemas.opengis.net/csw/2.0.2/record.xsd
export type Record = BriefRecord & Partial<FullRecord>;

export type Records = Record[];

type ArrayOrPrimitive<T> = T | T[];
function toArray<T>(val: ArrayOrPrimitive<T>): T[] | undefined {
  if (!isDefined(val)) return undefined;
  return Array.isArray(val) ? val : [val];
}

export interface BriefRecord {
  BoundingBox?: BoundingBox[];
  identifier: ArrayOrPrimitive<string>;
  title: ArrayOrPrimitive<string>;
  type?: string;
}

export type CswURI = String & {
  scheme?: string;
  protocol?: string;
  description?: string;
  name?: string;
};

export interface SummaryRecord extends BriefRecord {
  abstract?: ArrayOrPrimitive<string>;
  format?: ArrayOrPrimitive<string>;
  modified?: ArrayOrPrimitive<string>;
  relation?: ArrayOrPrimitive<string>;
  spatial?: ArrayOrPrimitive<string>;
  subject?: ArrayOrPrimitive<string>;
  references?: ArrayOrPrimitive<CswURI>;
  URI?: ArrayOrPrimitive<CswURI>;
}
export interface FullRecord extends SummaryRecord {
  contributor?: string;
  creator?: string;
  language?: string;
  publisher?: string;
  source?: string;
  description?: ArrayOrPrimitive<string>;
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
  field: QueryPropertyName | undefined;
  value: string;
  regex: boolean;
  groupName: string;
  children: MetadataGroup[];
  records: Records;
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

    records.forEach(record => {
      findGroup(metadataGroups, record)?.records.push(record);
    });

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
    return this.metadataGroups.map(
      g => `${this.catalogGroup.uniqueId}/${g.groupName}`
    );
  }

  getLayerId(layer: MetadataGroup | Record) {}

  @action
  createMembersFromLayers() {
    this.metadataGroups.forEach(metadataGroup =>
      this.createMetadataGroup(this.catalogGroup.uniqueId, metadataGroup)
    );
  }

  @action
  createMetadataGroup(
    parentId: string | undefined,
    metadataGroup: MetadataGroup
  ): CatalogGroup {
    const layerId = `${parentId}/${metadataGroup.groupName}`;
    const existingModel = this.catalogGroup.terria.getModelById(
      CatalogGroup,
      layerId
    );
    let model: CatalogGroup;
    if (existingModel === undefined) {
      model = new CatalogGroup(layerId, this.catalogGroup.terria);
      this.catalogGroup.terria.addModel(model);
    } else {
      model = existingModel;
    }
    // Replace the stratum inherited from the parent group.
    const stratum = CommonStrata.underride;
    model.strata.delete(stratum);
    model.setTrait(CommonStrata.underride, "name", metadataGroup.groupName);
    model.setTrait(
      CommonStrata.underride,
      "members",
      filterOutUndefined([
        ...metadataGroup.children.map(
          childMetadataGroup =>
            this.createMetadataGroup(layerId, childMetadataGroup).uniqueId
        ),
        ...metadataGroup.records.map(
          record => this.createRecord(layerId, record)?.uniqueId
        )
      ])
    );

    return model;
  }

  @action
  createRecord(
    parentId: string | undefined,
    record: Record
  ): BaseModel | undefined {
    const resourceFormats: [boolean, RegExp, ModelConstructor<BaseModel>][] = [
      [
        this.catalogGroup.includeWms,
        new RegExp(this.catalogGroup.wmsResourceFormat, "i"),
        WebMapServiceCatalogItem
      ],
      [
        this.catalogGroup.includeEsriMapServer,
        new RegExp(this.catalogGroup.esriMapServerResourceFormat, "i"),
        ArcGisMapServerCatalogItem
      ],
      [
        this.catalogGroup.includeKml,
        new RegExp(this.catalogGroup.kmlResourceFormat, "i"),
        KmlCatalogItem
      ],
      [
        this.catalogGroup.includeGeoJson,
        new RegExp(this.catalogGroup.geoJsonResourceFormat, "i"),
        GeoJsonCatalogItem
      ],
      [
        this.catalogGroup.includeCsv,
        new RegExp(this.catalogGroup.csvResourceFormat, "i"),
        CsvCatalogItem
      ]
    ];

    const uris = toArray(record.URI ?? record.references);
    if (!isDefined(uris)) {
      return;
    }
    // maybe more than one url that results in a data layer here - so check for
    // the acceptable ones, store the others as downloadUrls that can be
    // displayed in the metadata summary for the layer
    const downloadUrls: { url: string; description?: string }[] = [];
    /**
     * Array of acceptable URLS for catalog item. It indecies map to resourceFormats index.
     * For example - if `acceptableUrls[1]` is defined, it maps to `resourceFormats[1]`
     */
    const acceptableUris: CswURI[] = [];

    const filteredResourceFormats = resourceFormats.filter(f => f[0]);

    let legendUri: CswURI | undefined = undefined;
    for (var m = 0; m < uris.length; m++) {
      var uri = uris[m];
      if (!uri) return;
      const resourceIndex = filteredResourceFormats.findIndex(f =>
        (uri!.protocol ?? uri!.scheme)?.match(f[1])
      );

      // If matching resource is found, and an acceptable URL hasn't been set for it -> add it
      if (resourceIndex !== -1 && !acceptableUris[resourceIndex]) {
        acceptableUris[resourceIndex] = uri;
      } else {
        if (uri?.description === "LegendUrl") {
          legendUri = uri;
        }
        downloadUrls.push({
          url: uri.toString(),
          description: uri.description ? uri.description : uri.name
        });
      }
    }

    const layerId = `${parentId}/${record.identifier}`;
    const urlIndex = acceptableUris.findIndex(url => isDefined(url));

    if (urlIndex !== -1) {
      const modelConstructor = resourceFormats[urlIndex][2];
      const existingModel = this.catalogGroup.terria.getModelById(
        modelConstructor,
        layerId
      );
      let model: BaseModel;
      if (existingModel === undefined) {
        model = new modelConstructor(layerId, this.catalogGroup.terria);
        this.catalogGroup.terria.addModel(model);
      } else {
        model = existingModel;
      }
      // Replace the stratum inherited from the parent group.
      const stratum = CommonStrata.underride;
      model.strata.delete(stratum);
      model.setTrait(stratum, "name", record.title ?? record.identifier);
      const uri = acceptableUris[urlIndex];
      model.setTrait(stratum, "url", uri.toString());

      if (record.abstract) {
        model.setTrait(
          stratum,
          "description",
          toArray(record.abstract)?.join("\n\n")
        );
      } else if (record.description) {
        model.setTrait(
          stratum,
          "description",
          toArray(record.description)?.join("\n\n")
        );
      }

      const infoSections: InfoSectionTraits[] = [];

      if (record.contributor) {
        infoSections.push({
          name: i18next.t("models.csw.dataResponsibility"),
          content: record.contributor
        });
      }

      model.setTrait(stratum, "info", infoSections);

      model.setTrait(stratum, "metadataUrls", [
        {
          title: i18next.t("models.csw.metadataURL"),
          url: new URI(
            proxyCatalogItemUrl(this.catalogGroup, this.catalogGroup.url!)
          )
            .query({
              service: "CSW",
              version: "2.0.2",
              request: "GetRecordById",
              outputSchema: "http://www.opengis.net/cat/csw/2.0.2",
              ElementSetName: "full",
              id: record.identifier
            })
            .toString()
        }
      ]);

      if (legendUri) {
        model.setTrait(stratum, "legends", [{ url: legendUri.toString() }]);
      }

      // catalogItem.info.push({
      //   name: i18next.t("models.csw.links"),
      //   content: downloadUrls.reduce(function(previousValue, downloadUrl) {
      //     return (
      //       previousValue +
      //       "[" +
      //       downloadUrl.description +
      //       "](" +
      //       downloadUrl.url +
      //       ")\n\n"
      //     );
      //   }, "")
      // });

      // If this is a WMS item, we MUST set `layers` trait to `uri.name`
      if (model instanceof WebMapServiceCatalogItem) {
        if (!uri.name) {
          return;
        }
        model.setTrait(stratum, "layers", uri.name);
      }

      // Same with ArgGis MapServer
      if (model instanceof ArcGisMapServerCatalogItem) {
        if (!uri.name) {
          return;
        }
        model.setTrait(stratum, "layers", uri.name);
      }

      return model;
    }
  }
}

function addMetadataGroups(
  keys: string[],
  index: number,
  group: MetadataGroup[],
  separator: string,
  queryField: QueryPropertyName
) {
  if (index > keys.length - 1) return;

  let groupIndex = group.findIndex(g => g.groupName === keys[index]);

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
      groupName: keys[index],
      children: [],
      records: []
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

// find groups that the record belongs to
function findGroup(
  metadataGroups: MetadataGroup[],
  record: Record
): MetadataGroup | undefined {
  for (var i = 0; i < metadataGroups.length; i++) {
    const group = metadataGroups[i];
    if (group.field) {
      const fields = filterOutUndefined(toArray(record[group.field]) ?? []);
      if (fields.find(f => matchValue(group.value, f, group.regex))) {
        if (group.children) {
          // recurse to see if it fits into any of the children
          const childGroup = findGroup(group.children, record);
          if (isDefined(childGroup)) {
            return childGroup;
          }
        }

        return group;
      }
    }
  }
}

function matchValue(value: string, recordValue: string, regex?: boolean) {
  if (isDefined(regex) && regex) {
    // regular expression so parse it and check string against it
    var regExp = new RegExp(value);
    return regExp.test(recordValue);
  } else {
    return value === recordValue;
  }
}

StratumOrder.addLoadStratum(CswStratum.stratumName);

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
      cswStratum.createMembersFromLayers();
    }
  }
}
