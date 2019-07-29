import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import Feature from "../Models/Feature";
import Model from "../Models/Model";
import FeatureInfoTraits from "../Traits/FeatureInfoTraits";

const loadJson = require("../Core/loadJson");
const proxyCatalogItemUrl = require("../Models/proxyCatalogItemUrl");

type Target = Model<FeatureInfoTraits>;

export default function FeatureInfoMixin<T extends Constructor<Target>>(
  Base: T
) {
  abstract class FeatureInfoMixin extends Base {
    /**
     * Returns a {@link Feature} for the pick result.
     */
    abstract buildFeatureFromPickResult(
      screenPosition: Cartesian2,
      pickResult: any
    ): Feature | undefined;

    /**
     * Returns a {@link Feature} for the pick result. If `featureInfoUrlTemplate` is set,
     * it asynchronously loads additional info from the url.
     */
    getFeaturesFromPickResult(
      screenPosition: Cartesian2,
      pickResult: any
    ): Feature | undefined {
      const feature = this.buildFeatureFromPickResult(
        screenPosition,
        pickResult
      );
      if (isDefined(feature)) {
        feature._catalogItem = this;
        if (isDefined(this.featureInfoUrlTemplate)) {
          (async () => {
            const resource = new Resource({
              url: proxyCatalogItemUrl(this, this.featureInfoUrlTemplate, "0d"),
              templateValues: feature.properties.getValue()
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
          })();
        }
      }
      return feature;
    }
  }

  return FeatureInfoMixin;
}
