import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import UrlTraits from "./UrlTraits";

export class QueryParamTraits extends ModelTraits {
  @primitiveTrait({
    name: "Parameter name",
    type: "string",
    description: "The name of the query parameter."
  })
  name?: string;

  @primitiveTrait({
    name: "Parameter value",
    type: "string",
    description:
      "The value of the query parameter. Parameter values starting with" +
      " `DATE!`, eg. `DATE!HH:MM`, will be replaced wih the current date and" +
      " time, formatted according to the format string following the `!`." +
      " For more information on the format string format, see the " +
      " [dateformat](https://github.com/felixge/node-dateformat) library."
  })
  value?: string;
}

/** Not all traits here will be supported by all catalog items that use them */
export default class ApiRequestTraits extends mixTraits(UrlTraits) {
  @objectArrayTrait({
    name: "Query parameters",
    type: QueryParamTraits,
    description: "Query parameters to supply to the API",
    idProperty: "name"
  })
  queryParameters: QueryParamTraits[] = [];

  @objectArrayTrait({
    name: "Query parameters for updates",
    type: QueryParamTraits,
    description:
      "Query parameters to supply to the API on subsequent calls after the first call.",
    idProperty: "name"
  })
  updateQueryParameters: QueryParamTraits[] = [];

  @anyTrait({
    name: "Request body",
    description:
      "JSON body to be sent with the HTTP request to the server. If provided, the request will be made as POST rather than a GET."
  })
  requestData?: any;

  @primitiveTrait({
    name: "POST as form data",
    type: "boolean",
    description: "Send the request data as form data instead of a JSON body."
  })
  postRequestDataAsFormData?: boolean = false;

  @primitiveTrait({
    name: "Response data path",
    type: "string",
    description:
      "Path to relevant data in JSON response. eg: `some.user.name`, `some.users[0].name` or `some.users[].name`"
  })
  responseDataPath?: string;
}
