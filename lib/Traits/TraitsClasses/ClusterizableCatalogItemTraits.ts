import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class ClusterizableCatalogItemTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "clusterize",
    description: "If true, clusterize entities"
  })
  clusterize: boolean = false;
}
