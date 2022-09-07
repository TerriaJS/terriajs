import isDefined from "../Core/isDefined";
import { JsonObject } from "../Core/Json";
import TableMixin from "../ModelMixins/TableMixin";
import TerriaFeature from "../Models/Feature/Feature";
import { isTerriaFeatureData } from "../Models/Feature/FeatureData";

/** Adds timeseries chart to feature info context (on terria.timeSeries property).
 * This enables timeseries chart to be used in featureInfoTemplate like so:
 * - default chart = `{{terria.timeSeries.chart}}`
 * - customised chart:
 * ```
 *   <h4>{{terria.timeSeries.title}}</h4>
 *   <chart x-column="{{terria.timeSeries.xName}}"
 *       y-column="{{terria.timeSeries.yName}}"
 *       id="{{terria.timeSeries.id}}"
 *       column-units="{{terria.timeSeries.units}}">
 *           {{terria.timeSeries.data}}
 *   </chart>
 * ```
 */
export const tableFeatureInfoContext: (
  catalogItem: TableMixin.Instance
) => (feature: TerriaFeature) => JsonObject = (catalogItem) => (feature) => {
  // Find rows for feature
  if (!catalogItem.isSampled) return {};

  const style = catalogItem.activeTableStyle;

  // We have two methods for getting rowIds for current feature
  // - createLongitudeLatitudeFeaturePerId will place them on `Feature.tableRowIds`
  // - createRegionMappedImageryProvider - we can look at feature properties
  const rowIds = isTerriaFeatureData(feature.data)
    ? feature.data.rowIds ?? []
    : [];

  if (!style.timeColumn || !style.colorColumn || rowIds.length < 2) return {};

  const chartColumns = [style.timeColumn, style.colorColumn];
  const csvData = [
    chartColumns.map((col) => col!.title).join(","),
    ...rowIds.map((i) =>
      chartColumns!.map((col) => col.valueFunctionForType(i)).join(",")
    )
  ]
    .join("\n")
    .replace(/\\n/g, "\\n");

  const title = style.colorColumn?.title;

  const featureId = feature.id.replace(/\"/g, "");

  const result = {
    terria: {
      timeSeries: {
        title: style.colorColumn?.title,
        xName: style.timeColumn?.title,
        yName: style.colorColumn?.title,
        units: chartColumns.map((column) => column.units || ""),
        id: featureId,
        data: csvData,
        chart: `<chart ${'identifier="' + featureId + '" '} ${
          title ? `title="${title}"` : ""
        }>${csvData}</chart>`
      }
    }
  };

  return result;
};
