import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class DiscreteTimeTraits extends ModelTraits {
  @primitiveTrait({
    name: "Time",
    description: "The discrete time, expressed as an ISO8601 string.",
    type: "string"
  })
  time?: string;

  @primitiveTrait({
    name: "Tag",
    description:
      "The tag associated with this time. If a tag is not specified, the time itself is used as the tag.",
    type: "string"
  })
  tag?: string;
}
