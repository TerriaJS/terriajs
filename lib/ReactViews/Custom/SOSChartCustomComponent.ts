import createGuid from "terriajs-cesium/Source/Core/createGuid";
import SensorObservationServiceCatalogItem from "../../Models/Catalog/Ows/SensorObservationServiceCatalogItem";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { BaseModel } from "../../Models/Definition/Model";
import ChartCustomComponent, {
  ChartCustomComponentAttributes
} from "./ChartCustomComponent";
import { ProcessNodeContext } from "./CustomComponent";
interface SOSChartCustomComponentAttributes
  extends ChartCustomComponentAttributes {
  name?: string;
}
export default class SOSChartCustomComponent extends ChartCustomComponent<SensorObservationServiceCatalogItem> {
  get name(): string {
    return "sos-chart";
  }

  get attributes() {
    const attributes = super.attributes;
    attributes.push("name");
    return attributes;
  }

  protected constructCatalogItem(
    _id: string | undefined,
    context: ProcessNodeContext,
    _sourceReference: BaseModel | undefined
  ) {
    return context.catalogItem?.duplicateModel(createGuid()) as
      | SensorObservationServiceCatalogItem
      | undefined;
  }

  constructShareableCatalogItem = async (
    _id: string | undefined,
    context: ProcessNodeContext,
    _sourceReference: BaseModel | undefined
  ) =>
    this.createItemReference(
      context.catalogItem as SensorObservationServiceCatalogItem
    );

  protected setTraitsFromAttrs(
    item: SensorObservationServiceCatalogItem,
    attrs: SOSChartCustomComponentAttributes,
    _sourceIndex: number
  ): void {
    const featureOfInterestId = attrs.identifier;
    const featureName = attrs.name;
    const units = item.selectedObservable?.units;

    item.setTrait(CommonStrata.user, "showAsChart", true);
    item.setTrait(CommonStrata.user, "name", featureName || item.name);
    item.setTrait(
      CommonStrata.user,
      "chartFeatureOfInterestIdentifier",
      featureOfInterestId
    );
    item
      .addObject(CommonStrata.user, "columns", "values")
      ?.setTrait(CommonStrata.user, "units", units);
  }

  protected parseNodeAttrs(nodeAttrs: {
    [name: string]: string | undefined;
  }): SOSChartCustomComponentAttributes {
    const parsed: SOSChartCustomComponentAttributes = super.parseNodeAttrs(
      nodeAttrs
    );
    parsed.name = nodeAttrs["name"];
    return parsed;
  }
}
