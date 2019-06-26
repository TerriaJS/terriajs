import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class DataCustodianTraits extends ModelTraits {
  @primitiveTrait({
    name: "Data Custodian",
    type: "string",
    description:
      "Gets or sets a description of the custodian of this data item."
  })
  dataCustodian?: string;
}
