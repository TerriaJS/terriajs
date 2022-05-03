import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import TimeIntervalCollection from "terriajs-cesium/Source/Core/TimeIntervalCollection";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import filterOutUndefined from "../Core/filterOutUndefined";
import { JsonObject } from "../Core/Json";
import { getMakiIcon } from "../Map/Icons/Maki/MakiIcons";
import TableColumn from "./TableColumn";
import TableStyle from "./TableStyle";
import { isConstantStyleMap } from "./TableStyleMap";

export default function createLongitudeLatitudeFeaturePerRow(
  style: TableStyle,
  longitudes = style.longitudeColumn?.valuesAsNumbers.values,
  latitudes = style.latitudeColumn?.valuesAsNumbers.values
): Entity[] {
  if (!longitudes || !latitudes) return [];

  const tableColumns = style.tableModel.tableColumns;
  const intervals = style.moreThanOneTimeInterval
    ? style.timeIntervals ?? []
    : [];
  const rowIds = style.tableModel.rowIds;

  return filterOutUndefined(
    rowIds.map(rowId => {
      const longitude = longitudes[rowId];
      const latitude = latitudes[rowId];
      if (longitude === null || latitude === null) {
        return;
      }
      const colorValue =
        style.colorMap.mapValueToColor(
          style.colorColumn?.valuesForType[rowId]
        ) ?? null;

      const pointSize =
        style.pointSizeColumn !== undefined
          ? style.pointSizeMap.mapValueToPointSize(
              style.pointSizeColumn.valueFunctionForType(rowId)
            )
          : undefined;

      const pointStyle = isConstantStyleMap(style.pointStyleMap.styleMap)
        ? style.pointStyleMap.styleMap.style
        : style.pointStyleMap.styleMap.mapValueToStyle(rowId);
      const outlineStyle = isConstantStyleMap(style.outlineStyleMap.styleMap)
        ? style.outlineStyleMap.styleMap.style
        : style.outlineStyleMap.styleMap.mapValueToStyle(rowId);

      const outlineColorValue = Color.fromCssColorString(
        outlineStyle.color ?? style.tableModel.terria.baseMapContrastColor
      );

      const makiIcon = getMakiIcon(
        pointStyle.marker ?? "",
        colorValue.toCssColorString(),
        outlineStyle.width,
        outlineColorValue.toCssColorString(),
        pointSize ?? pointStyle.height,
        pointSize ?? pointStyle.width
      );

      const feature = new Entity({
        position: new ConstantPositionProperty(
          Cartesian3.fromDegrees(longitude, latitude, 0.0)
        ),
        point:
          pointStyle.marker === "point"
            ? new PointGraphics({
                color: colorValue,
                pixelSize: pointSize ?? pointStyle.height ?? pointStyle.width,
                outlineWidth: outlineStyle.width,
                outlineColor: outlineColorValue,
                heightReference: HeightReference.CLAMP_TO_GROUND
              })
            : undefined,
        billboard:
          pointStyle.marker !== "point"
            ? new BillboardGraphics({
                image: makiIcon ?? pointStyle.marker,
                color: !makiIcon ? colorValue : undefined,
                rotation: pointStyle.rotation,
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
      return feature;
    })
  );
}

export function getRowValues(
  index: number,
  tableColumns: Readonly<TableColumn[]>
): JsonObject {
  const result: JsonObject = {};

  tableColumns.forEach(column => {
    result[column.name] = column.valueFunctionForType(index);
  });

  return result;
}
