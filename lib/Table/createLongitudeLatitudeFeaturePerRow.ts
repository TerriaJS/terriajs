import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import TimeIntervalCollection from "terriajs-cesium/Source/Core/TimeIntervalCollection";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
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
        pointStyle,
        color,
        pointSize,
        outlineStyle,
        outlineColor,
        makiIcon
      } = getFeatureStyle(style, rowId);

      const feature = new TerriaFeature({
        position: new ConstantPositionProperty(
          Cartesian3.fromDegrees(longitude, latitude, 0.0)
        ),
        point:
          pointStyle.marker === "point"
            ? new PointGraphics({
                color: color,
                pixelSize: pointSize ?? pointStyle.height ?? pointStyle.width,
                outlineWidth: outlineStyle.width,
                outlineColor: outlineColor,
                heightReference: HeightReference.CLAMP_TO_GROUND
              })
            : undefined,
        billboard:
          pointStyle.marker !== "point"
            ? new BillboardGraphics({
                image: makiIcon ?? pointStyle.marker,
                color: !makiIcon ? color : undefined,
                width: pointStyle.width,
                height: pointStyle.height,
                rotation: CesiumMath.toRadians(
                  360 - (pointStyle.rotation ?? 0)
                ),
                pixelOffset: new Cartesian2(
                  pointStyle.pixelOffset?.[0],
                  pointStyle.pixelOffset?.[1]
                ),
                heightReference: HeightReference.CLAMP_TO_GROUND
              })
            : undefined
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
