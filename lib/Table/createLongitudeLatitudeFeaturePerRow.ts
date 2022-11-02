import { Cartesian3 as Cartesian3 } from "cesium";
import { TimeIntervalCollection as TimeIntervalCollection } from "cesium";
import { BillboardGraphics as BillboardGraphics } from "cesium";
import { ConstantPositionProperty as ConstantPositionProperty } from "cesium";
import { LabelGraphics as LabelGraphics } from "cesium";
import { PointGraphics as PointGraphics } from "cesium";
import { PropertyBag as PropertyBag } from "cesium";
import { HeightReference as HeightReference } from "cesium";
import filterOutUndefined from "../Core/filterOutUndefined";
import { JsonObject } from "../Core/Json";
import TerriaFeature from "../Models/Feature/Feature";
import { getFeatureStyle } from "./getFeatureStyle";
import TableColumn from "./TableColumn";
import TableStyle from "./TableStyle";

export default function createLongitudeLatitudeFeaturePerRow(
  style: TableStyle,
  longitudes = style.longitudeColumn?.valuesAsNumbers.values,
  latitudes = style.latitudeColumn?.valuesAsNumbers.values
): TerriaFeature[] {
  if (!longitudes || !latitudes) return [];

  const tableColumns = style.tableModel.tableColumns;
  const intervals = style.moreThanOneTimeInterval
    ? style.timeIntervals ?? []
    : [];
  const rowIds = style.tableModel.rowIds;

  return filterOutUndefined(
    rowIds.map((rowId) => {
      const longitude = longitudes[rowId];
      const latitude = latitudes[rowId];
      if (longitude === null || latitude === null) {
        return;
      }

      const {
        pointGraphicsOptions,
        billboardGraphicsOptions,
        labelGraphicsOptions,
        usePointGraphics
      } = getFeatureStyle(style, rowId);

      const feature = new TerriaFeature({
        position: new ConstantPositionProperty(
          Cartesian3.fromDegrees(longitude, latitude, 0.0)
        ),
        point:
          pointGraphicsOptions && usePointGraphics
            ? new PointGraphics({
                ...pointGraphicsOptions,
                heightReference: HeightReference.CLAMP_TO_GROUND
              })
            : undefined,
        billboard:
          billboardGraphicsOptions && !usePointGraphics
            ? new BillboardGraphics({
                ...billboardGraphicsOptions,
                heightReference: HeightReference.CLAMP_TO_GROUND
              })
            : undefined,
        label: labelGraphicsOptions
          ? new LabelGraphics({
              ...labelGraphicsOptions,
              heightReference: HeightReference.CLAMP_TO_GROUND
            })
          : undefined
        // Note: we don't add path/PathGraphicsOptions here as it is only relevant to time-series (see `createLongitudeLatitudeFeaturePerId.ts`)
      });
      const timeInterval = intervals[rowId];
      if (timeInterval)
        feature.availability = new TimeIntervalCollection([timeInterval]);
      feature.properties = new PropertyBag(getRowValues(rowId, tableColumns));
      feature.data = { rowIds: [rowId], type: "terriaFeatureData" };
      return feature;
    })
  );
}

export function getRowValues(
  index: number,
  tableColumns: Readonly<TableColumn[]>
): JsonObject {
  const result: JsonObject = {};

  tableColumns.forEach((column) => {
    result[column.name] = column.valueFunctionForType(index);
  });

  return result;
}
