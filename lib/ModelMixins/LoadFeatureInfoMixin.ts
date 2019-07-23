import Resource from "terriajs-cesium/Source/Core/Resource";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import Feature from "../Models/Feature";
import Model from "../Models/Model";
import LoadFeatureInfoTraits from "../Traits/LoadFeatureInfoTraits";

const loadJson = require("../Core/loadJson");
const proxyCatalogItemUrl = require("../Models/proxyCatalogItemUrl");

type Target = Model<LoadFeatureInfoTraits>;

export default function LoadFeatureInfoMixin<T extends Constructor<Target>>(
  Base: T
) {
  class LoadFeatureInfoMixin extends Base {
    /**
     * Asynchronously loads feature info from a Url built by filling `featureInfoUrlTemplate`
     * with feature properties.
     */
    async loadFeatureInfoFromUrl(feature: Feature) {
      if (!isDefined(this.featureInfoUrlTemplate)) {
        return;
      }

      const resource = new Resource({
        url: proxyCatalogItemUrl(this.featureInfoUrlTemplate, "0d"),
        templateValues: feature.properties
      });
      try {
        const featureInfo = await loadJson(resource);
        Object.keys(featureInfo).forEach(property => {
          feature.properties.addProperty(property, featureInfo[property]);
        });
      } catch (e) {
        feature.properties.addProperty(
          "Error",
          "Unable to retrieve feature details from:\n\n" + resource.url
        );
      }
    }
  }

  return LoadFeatureInfoMixin;
}
