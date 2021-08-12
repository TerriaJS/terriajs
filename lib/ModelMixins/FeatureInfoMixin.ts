import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Resource from "terriajs-cesium/Source/Core/Resource";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import loadJson from "../Core/loadJson";
import Feature from "../Models/Feature";
import Model from "../Models/Definition/Model";
import FeatureInfoTraits from "../Traits/TraitsClasses/FeatureInfoTraits";
import { action } from "mobx";
import proxyCatalogItemUrl from "../Models/Catalog/proxyCatalogItemUrl";

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
    @action
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

        (async () => {
          if (isDefined(this.featureInfoUrlTemplate)) {
            const resource = new Resource({
              url: proxyCatalogItemUrl(this, this.featureInfoUrlTemplate, "0d"),
              templateValues: feature.properties
                ? feature.properties.getValue(new JulianDate())
                : undefined
            });
            try {
              const featureInfo = await loadJson(resource);
              Object.keys(featureInfo).forEach(property => {
                if (!feature.properties) {
                  feature.properties = new PropertyBag();
                }
                feature.properties.addProperty(property, featureInfo[property]);
              });
            } catch (e) {
              if (!feature.properties) {
                feature.properties = new PropertyBag();
              }
              feature.properties.addProperty(
                "Error",
                "Unable to retrieve feature details from:\n\n" + resource.url
              );
            }
          }
        })();
      }
      return feature;
    }
  }

  return FeatureInfoMixin;
}
