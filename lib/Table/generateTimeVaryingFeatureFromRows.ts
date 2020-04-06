// import TableStyle from "./TableStyle";
// import TableColumn from "./TableColumn";
// import Entity from "terriajs-cesium/Source/DataSources/Entity";
// import TableColumnType from "./TableColumnType";
// import SampledPositionProperty from "terriajs-cesium/Source/DataSources/SampledPositionProperty";
// import TimeIntervalCollectionPositionProperty from "terriajs-cesium/Source/DataSources/TimeIntervalCollectionPositionProperty";
// import SampledProperty from "terriajs-cesium/Source/DataSources/SampledProperty";
// import TimeIntervalCollectionProperty from "terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty";
// import Color from "terriajs-cesium/Source/Core/Color";
// import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
// import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";

// type TableStyleWithLatLng = TableStyle & {
//   readonly latitudeColumn: TableColumn;
//   readonly longitudeColumn: TableColumn;
// };

// /**
//  * Generates a time varying feature for the given rows applying the given style.
//  */
// export default function generateTimeVaryingFeatureFromRows(
//   rowIds: number[],
//   style: TableStyleWithLatLng,
//   idColumns: TableColumn[],
//   timeColumn: TableColumn
// ): Entity {
//   const {
//     position,
//     color,
//     scale,
//     pointSize,
//     properties,
//     descriptions
//   } = createFeatureProperties(style);

//   const colorColumn = style.colorColumn;
//   const valueFunction =
//     colorColumn !== undefined ? colorColumn.valueFunctionForType : () => null;

//   const longitudes = style.longitudeColumn.valuesAsNumbers.values;
//   const latitiudes = style.latitudeColumn.valuesAsNumbers.values;
//   const colorMap = style.colorMap;
//   const pointSizeMap = style.pointSizeMap;

//   rowIds.forEach(rowId => {
//     const interval = timeColumn.timeIntervals[rowId];
//     const longitude = longitudes[rowId];
//     const latitude = longitudes[rowId];
//     const value = valueFunction(rowId);

//     addDataPointToProperty(
//       position,
//       Cartesian3.fromDegrees(longitude, latitude, 0.0),
//       interval
//     );
//     addDataPointToProperty(color, colorMap.mapValueToColor(value), interval);
//     addDataPointToProperty(
//       pointSize,
//       pointSizeMap.mapValueToPointSize(value),
//       interval
//     );
//   });
// }

// function addDataPointToProperty(
//   property: SampledProperty | TimeIntervalCollectionProperty,
//   dataPoint: any,
//   interval: TimeInterval
// ) {
//   if (property instanceof SampledProperty) {
//     property.addSample(interval.startDate, dataPoint);
//   } else {
//     var thisInterval = interval.clone();
//     thisInterval.data = dataPoint;
//     property.intervals.addInterval(thisInterval);
//   }
// }

// function createFeatureProperties(style: TableStyleWithLatLng) {
//   const isSampled = style.timeTraits.isSampled;
//   const tableHasScalarColumn = style.tableModel.tableColumns.find(
//     col => col.type === TableColumnType.scalar
//   );
//   const shouldInterpolateColorAndSize = isSampled && tableHasScalarColumn;
//   return {
//     position: isSampled
//       ? new SampledPositionProperty()
//       : new TimeIntervalCollectionPositionProperty(),
//     color: shouldInterpolateColorAndSize
//       ? new SampledProperty(Color)
//       : new TimeIntervalCollectionProperty(),
//     scale: shouldInterpolateColorAndSize
//       ? new SampledProperty(Color)
//       : new TimeIntervalCollectionProperty(),
//     pixelSize: shouldInterpolateColorAndSize
//       ? new SampledProperty(Color)
//       : new TimeIntervalCollectionProperty(),
//     properties: new TimeIntervalCollectionProperty(),
//     descriptions: new TimeIntervalCollectionProperty()
//   };
// }
