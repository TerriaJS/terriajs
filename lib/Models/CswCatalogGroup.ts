import loadXML from "../Core/loadXML";
import xml2json from "../ThirdParty/xml2json";
import { BoundingBox } from "./OwsInterfaces";

// Source files:
// http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd
// http://schemas.opengis.net/csw/2.0.2/CSW-publication.xsd
// http://schemas.opengis.net/csw/2.0.2/csw.xsd
// http://schemas.opengis.net/csw/2.0.2/record.xsd
export type Record = BriefRecord | SummaryRecord | FullRecord;

export type Records = BriefRecord[] | SummaryRecord[] | FullRecord[];

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
  references?: string[];
  URI?: string[];
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
  ListOfValues?: { Value: any[] };
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
  DomainValues: DomainValuesType[];
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
}

export interface GetRecordByIdResponse {
  Record?: Record;
}

export async function test() {
  const capabilitiesXml = await loadXML(
    "http://oa-gis.csiro.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetDomain&propertyname=awavea"
  );
  const json = xml2json(capabilitiesXml) as GetDomainResponseType;

  console.log(json);
}
