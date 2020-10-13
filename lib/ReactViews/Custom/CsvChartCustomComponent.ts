import CommonStrata from "../../Models/CommonStrata";
import CsvCatalogItem from "../../Models/CsvCatalogItem";
import Model, { BaseModel } from "../../Models/Model";
import CsvCatalogItemTraits from "../../Traits/CsvCatalogItemTraits";
import ChartCustomComponent, {
  ChartCustomComponentAttributes,
  splitStringIfDefined
} from "./ChartCustomComponent";
import { ProcessNodeContext } from "./CustomComponent";

interface CsvChartCustomComponentAttributes
  extends ChartCustomComponentAttributes {
  /** If present, the chart is updated from [poll-sources] every [poll-seconds] seconds.
   *  TODO: Returned data is merged into existing data and shown. */
  pollSeconds?: number;

  /** Comma-separated list of URLs to poll every [poll-seconds] seconds. Defaults to sources */
  pollSources?: string[];

  /** Either 'true' or 'false' (case sensitive). Pass 'true' to completely replace the data, 'false' to update the existing data. Defaults to false (updating). */
  pollReplace?: boolean;

  /** Set to a non-empty string to display a disclaimer at the top of the chart panel when this chart is expanded into the chart panel. */
  chartDisclaimer?: string;
}

type CsvCatalogItemType = Model<CsvCatalogItemTraits>;
export default class CsvChartCustomComponent extends ChartCustomComponent<
  CsvCatalogItemType
> {
  get name(): string {
    // For backward compatibility reasons, since the original ChartCustomComponent assumed your catalog item was a Csv, we use the name "chart" even though "csv-chart" would be more correct
    return "chart";
  }

  get attributes(): string[] {
    return super.attributes.concat([
      "poll-seconds",
      "poll-sources",
      "poll-replace",
      "chart-disclaimer"
    ]);
  }

  protected constructCatalogItem(
    id: string | undefined,
    context: ProcessNodeContext,
    sourceReference: BaseModel | undefined
  ): CsvCatalogItemType {
    return new CsvCatalogItem(id, context.terria, sourceReference);
  }

  protected setTraitsFromAttrs(
    item: CsvCatalogItemType,
    attrs: CsvChartCustomComponentAttributes,
    sourceIndex: number
  ) {
    // Set url
    item.setTrait(
      CommonStrata.user,
      "url",
      attrs.sources && attrs.sources[sourceIndex]
    );

    // Set name
    let name = attrs.title;
    if (attrs.sourceNames && attrs.sourceNames[sourceIndex]) {
      name = `${name} - ${attrs.sourceNames[sourceIndex]}`;
    }
    item.setTrait(CommonStrata.user, "name", name);

    // Set polling traits
    if (attrs.pollSeconds) {
      const pollUrl = attrs.pollSources && attrs.pollSources[sourceIndex];
      item.polling.setTrait(CommonStrata.user, "seconds", attrs.pollSeconds);
      item.polling.setTrait(CommonStrata.user, "url", pollUrl);
      item.polling.setTrait(
        CommonStrata.user,
        "shouldReplaceData",
        attrs.pollReplace
      );
    }

    if (!!attrs.chartDisclaimer) {
      item.setTrait(
        CommonStrata.user,
        "chartDisclaimer",
        attrs.chartDisclaimer
      );
    }

    if (attrs.columnTitles !== undefined) {
      // Set column titles
      attrs.columnTitles.forEach(({ name, title }) => {
        const column = item.addObject(CommonStrata.user, "columns", name)!;
        column.setTrait(CommonStrata.user, "title", title);
      });
    }

    if (attrs.columnUnits !== undefined) {
      // Set column units
      attrs.columnUnits.forEach(({ name, units }) => {
        const column = item.addObject(CommonStrata.user, "columns", name)!;
        column.setTrait(CommonStrata.user, "units", units);
      });
    }

    // Set chart axes
    if (attrs.xColumn || attrs.yColumns) {
      const chartStyle = item.addObject(CommonStrata.user, "styles", "chart")!;
      chartStyle.chart.setTrait(
        CommonStrata.user,
        "xAxisColumn",
        attrs.xColumn
      );

      (attrs.yColumns || []).forEach(y => {
        chartStyle.chart.addObject(CommonStrata.user, "lines", y)!;
      });

      item.setTrait(CommonStrata.user, "activeStyle", "chart");
    }
  }

  setTraitsFromBody = (item: CsvCatalogItemType, csvString: string) => {
    item.setTrait(CommonStrata.user, "csvString", csvString);
  };

  protected parseNodeAttrs(nodeAttrs: {
    [name: string]: string | undefined;
  }): CsvChartCustomComponentAttributes {
    const parsed: CsvChartCustomComponentAttributes = super.parseNodeAttrs(
      nodeAttrs
    );
    parsed.pollSeconds = parseIntOrUndefined(nodeAttrs["poll-seconds"]);
    parsed.pollSources = splitStringIfDefined(nodeAttrs["poll-sources"]);
    parsed.pollReplace = nodeAttrs["poll-replace"] === "true";
    parsed.chartDisclaimer = nodeAttrs["chart-disclaimer"] || undefined;
    return parsed;
  }
}

function parseIntOrUndefined(s: string | undefined): number | undefined {
  const maybeInt = parseInt(s || "");
  return isNaN(maybeInt) ? undefined : maybeInt;
}
