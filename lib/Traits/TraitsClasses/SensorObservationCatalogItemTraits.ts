import i18next from "i18next";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import TableTraits from "./Table/TableTraits";
import UrlTraits from "./UrlTraits";

export class ObservablePropertyTraits extends ModelTraits {
  @primitiveTrait({
    name: "Identifier",
    type: "string",
    description:
      "A string that identifies the property when communicating with the server."
  })
  identifier?: string;

  @primitiveTrait({
    name: "Title",
    type: "string",
    description: "A display title."
  })
  title?: string;

  @primitiveTrait({
    name: "Units",
    type: "string",
    description: "The unit of the property value"
  })
  units?: string;

  @primitiveTrait({
    name: "Default duration",
    type: "string",
    description:
      "The intervals between observations. eg: 10d - Final character must be s, h, d or y for seconds, hours, days or years."
  })
  defaultDuration?: string;
}

export class ProcedureTraits extends mixTraits(ObservablePropertyTraits) {}

export default class SensorObservationCatalogItemTraits extends mixTraits(
  TableTraits,
  UrlTraits
) {
  @primitiveTrait({
    name: "Request size limit",
    type: "number",
    description:
      "Gets or sets the maximum number of timeseries to request of the server in a single GetObservation request. Servers may have a Response Size Limit, eg. 250. Note the number of responses may be different to the number requested, eg. the BoM server can return > 1 timeseries/feature identifier, (such as ...stations/41001702), so it can be sensible to set this below the response size limit."
  })
  requestSizeLimit = 200;

  @primitiveTrait({
    name: "Request number limit",
    type: "number",
    description:
      "Gets or sets the maximum number of GetObservation requests that we can fire off at a time. If the response size limit is 250, and this is 4, then observations for at most 1000 features will load. If there are more than 1000 features, they will be shown without observation data, until they are clicked."
  })
  requestNumberLimit = 3;

  @primitiveTrait({
    name: "Request template",
    type: "string",
    description:
      "The template XML string to POST to the SOS server to query for GetObservation. If this property is undefined, `SensorObservationServiceCatalogItem.defaultRequestTemplate` is used. This is used as a Mustache template. See SensorObservationServiceRequestTemplate.xml for the default. Be careful with newlines inside tags: Mustache can add an extra space in the front of them, which causes the request to fail on the SOS server."
  })
  requestTemplate?: string;

  @objectArrayTrait({
    name: "Observable properties",
    type: ObservablePropertyTraits,
    idProperty: "identifier",
    description:
      "The sensor observation service observableProperties that the user can choose from for this catalog item."
  })
  observableProperties: ObservablePropertyTraits[] = [];

  @primitiveTrait({
    name: "Filter by procedure",
    type: "boolean",
    description:
      "Whether to include the list of procedures in GetFeatureOfInterest calls, so that only locations that support those procedures are returned. For some servers (such as BoM's Water Data Online), this causes the request to time out."
  })
  filterByProcedures: boolean = true;

  @objectArrayTrait({
    name: "Procedures",
    type: ProcedureTraits,
    idProperty: "identifier",
    description:
      "The sensor observation service procedures that the user can choose from for this catalog item."
  })
  procedures: ProcedureTraits[] = [];

  @primitiveTrait({
    name: "Procedures name",
    type: "string",
    description:
      "Gets or sets the name seen by the user for the list of procedures. Defaults to `Procedure`, but eg. for BoM, `Frequency` would be better."
  })
  proceduresName = i18next.t("models.sensorObservationService.procedure");

  @primitiveTrait({
    name: "Observable properties name",
    type: "string",
    description:
      "Gets or sets the name seen by the user for the list of observable properties. Defaults to `Property`, but eg. for BoM, `Observation type` would be better."
  })
  observablePropertiesName = i18next.t(
    "models.sensorObservationService.property"
  );

  @primitiveArrayTrait({
    name: "Station ID whitelist",
    type: "string",
    description:
      "If set, an array of IDs. Only station IDs that match these will be included."
  })
  stationIdWhitelist?: string[];

  @primitiveArrayTrait({
    name: "Station ID blacklist",
    type: "string",
    description:
      "If set, an array of IDs. Only station IDs that match these will be included."
  })
  stationIdBlacklist?: string[];

  @primitiveTrait({
    name: "Start date",
    type: "string",
    description:
      "An start date in ISO8601 format. All requests filter to this start date. Set to undefined for no temporal filter."
  })
  startDate?: string;

  @primitiveTrait({
    name: "End date",
    type: "string",
    description:
      "An end date in ISO8601 format. All requests filter to this end date. Set to undefined to use the current date."
  })
  endDate?: string;

  @primitiveTrait({
    name: "Show as chart",
    type: "boolean",
    description:
      "When `true`, loads the observation data for charts instead of feature points data to plot on map"
  })
  showAsChart = false;

  @primitiveTrait({
    name: "Chart feature of interest identifier",
    type: "string",
    description:
      "The `identifier` of the feature-of-interest for which we are showing the chart."
  })
  chartFeatureOfInterestIdentifier?: string;

  @primitiveTrait({
    name: "Selected observable id",
    type: "string",
    description: "The identifier of the selected observable property"
  })
  selectedObservableId?: string;
}
