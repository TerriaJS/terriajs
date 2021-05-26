import anyTrait from "./anyTrait";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";
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

export class ApiRequestTraits extends UrlTraits {
  @objectArrayTrait({
    name: "Query parameters",
    type: QueryParamTraits,
    description: "Query parameters to supply to the API",
    idProperty: "name"
  })
  queryParameters: QueryParamTraits[] = [];

  @anyTrait({
    name: "Request body",
    description:
      "JSON body to be sent with the HTTP request to the server. If provided, the request will be made as POST rather than a GET."
  })
  requestBody?: any;
}
