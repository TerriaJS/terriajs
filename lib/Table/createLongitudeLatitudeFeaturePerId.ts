import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import Iso8601 from "terriajs-cesium/Source/Core/Iso8601";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Packable from "terriajs-cesium/Source/Core/Packable";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import TimeIntervalCollection from "terriajs-cesium/Source/Core/TimeIntervalCollection";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import LabelGraphics from "terriajs-cesium/Source/DataSources/LabelGraphics";
import PathGraphics from "terriajs-cesium/Source/DataSources/PathGraphics";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import PolylineGlowMaterialProperty from "terriajs-cesium/Source/DataSources/PolylineGlowMaterialProperty";
import SampledPositionProperty from "terriajs-cesium/Source/DataSources/SampledPositionProperty";
import SampledProperty from "terriajs-cesium/Source/DataSources/SampledProperty";
import TimeIntervalCollectionPositionProperty from "terriajs-cesium/Source/DataSources/TimeIntervalCollectionPositionProperty";
import TimeIntervalCollectionProperty from "terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import LabelStyle from "terriajs-cesium/Source/Scene/LabelStyle";
import TerriaFeature from "../Models/Feature/Feature";
import { getRowValues } from "./createLongitudeLatitudeFeaturePerRow";
import { getFeatureStyle } from "./getFeatureStyle";
import TableColumn from "./TableColumn";
import TableColumnType from "./TableColumnType";
import TableStyle from "./TableStyle";

type RequiredTableStyle = TableStyle & {
  longitudeColumn: TableColumn;
  latitudeColumn: TableColumn;
  timeColumn: TableColumn;
  idColumns: TableColumn[];
  timeIntervals: (JulianDate | null)[];
};

/**
 * Create lat/lon features, one for each id group in the table
 */
export default function createLongitudeLatitudeFeaturePerId(
  style: RequiredTableStyle
): TerriaFeature[] {
  const features = style.rowGroups.map(([featureId, rowIds]) =>
    createFeature(featureId, rowIds, style)
  );
  return features;
}

function createProperty(type: Packable, interpolate: boolean) {
  return interpolate
    ? new SampledProperty(type)
    : new TimeIntervalCollectionProperty();
}

function createFeature(
  featureId: string,
  rowIds: number[],
  style: RequiredTableStyle
): TerriaFeature {
  const isSampled = !!style.isSampled;
  const tableHasScalarColumn = !!style.tableModel.tableColumns.find(
    (col) => col.type === TableColumnType.scalar
  );
  const interpolate = isSampled && tableHasScalarColumn;

  const positionProperty = isSampled
    ? new SampledPositionProperty()
    : new TimeIntervalCollectionPositionProperty();

  const colorProperty = createProperty(Color, interpolate);

  const outlineColorProperty = createProperty(Color, interpolate);
  const outlineWidthProperty = createProperty(Number, interpolate);

  const pointSizeProperty = createProperty(Number, interpolate);
  const pointRotationProperty = createProperty(Number, interpolate);
  const pointPixelOffsetProperty = createProperty(Cartesian2, interpolate);
  const pointHeightProperty = createProperty(Number, interpolate);
  const pointWidthProperty = createProperty(Number, interpolate);
  const pointMarkerProperty = new TimeIntervalCollectionProperty();

  const trailProperties = style.pointTrailStyleMap.traits.enabled
    ? {
        leadTime: createProperty(Number, interpolate),
        trailTime: createProperty(Number, interpolate),
        width: createProperty(Number, interpolate),
        resolution: createProperty(Number, interpolate),
        solidColor:
          style.pointTrailStyleMap.traits.materialType === "solidColor"
            ? {
                color: createProperty(Color, interpolate)
              }
            : undefined,
        polylineGlow:
          style.pointTrailStyleMap.traits.materialType === "polylineGlow"
            ? {
                color: createProperty(Color, interpolate),
                glowPower: createProperty(Number, interpolate),
                taperPower: createProperty(Number, interpolate)
              }
            : undefined
      }
    : undefined;

  const labelProperties = style.labelStyleMap.traits.enabled
    ? {
        font: new TimeIntervalCollectionProperty(),
        text: new TimeIntervalCollectionProperty(),
        style: new TimeIntervalCollectionProperty(),
        scale: createProperty(Number, interpolate),
        fillColor: createProperty(Color, interpolate),
        outlineColor: createProperty(Color, interpolate),
        outlineWidth: createProperty(Number, interpolate),
        pixelOffset: createProperty(Cartesian2, interpolate)
      }
    : undefined;

  const properties = new TimeIntervalCollectionProperty();
  const description = new TimeIntervalCollectionProperty();

  const longitudes = style.longitudeColumn.valuesAsNumbers.values;
  const latitudes = style.latitudeColumn.valuesAsNumbers.values;
  const timeIntervals = style.timeIntervals;

  const availability = new TimeIntervalCollection();
  const tableColumns = style.tableModel.tableColumns;

  /** use `PointGraphics` or `BillboardGraphics`. This wil be false if any pointTraits.marker !== "point", as then we use images as billboards */
  let usePointGraphics = true;

  rowIds.forEach((rowId) => {
    const longitude = longitudes[rowId];
    const latitude = latitudes[rowId];
    const interval = timeIntervals[rowId];

    if (longitude === null || latitude === null || !interval) {
      return;
    }

    addSampleOrInterval(
      positionProperty,
      Cartesian3.fromDegrees(longitude, latitude, 0.0),
      interval
    );

    const {
      pointStyle,
      color,
      pointSize,
      outlineStyle,
      outlineColor,
      makiIcon,
      isMakiIcon,
      trailStyle,
      labelStyle
    } = getFeatureStyle(style, rowId);

    // Color symbolization
    // Only add color property for non maki icons - as we color maki icons directly (see `getMakiIcon()`)
    addSampleOrInterval(
      colorProperty,
      !isMakiIcon ? color : Color.WHITE,
      interval
    );

    // Point size symbolization
    addSampleOrInterval(
      pointSizeProperty,
      pointSize ?? pointStyle.height ?? pointStyle.width,
      interval
    );

    // Outline symbolization
    addSampleOrInterval(outlineColorProperty, outlineColor, interval);
    addSampleOrInterval(outlineWidthProperty, outlineStyle.width, interval);

    // Marker symbolization
    addSampleOrInterval(
      pointRotationProperty,
      CesiumMath.toRadians(360 - (pointStyle.rotation ?? 0)),
      interval
    );
    addSampleOrInterval(
      pointPixelOffsetProperty,
      new Cartesian2(
        pointStyle.pixelOffset?.[0] ?? 0,
        pointStyle.pixelOffset?.[1] ?? 0
      ),
      interval
    );
    addSampleOrInterval(
      pointHeightProperty,
      pointSize ?? pointStyle.height,
      interval
    );
    addSampleOrInterval(
      pointWidthProperty,
      pointSize ?? pointStyle.width,
      interval
    );

    if (isMakiIcon) {
      usePointGraphics = false;
    }

    addSampleOrInterval(
      pointMarkerProperty,
      makiIcon ?? pointStyle.marker,
      interval
    );

    // Label symbolization
    if (labelProperties) {
      addSampleOrInterval(labelProperties.font, labelStyle.font, interval);
      if (labelStyle.labelColumn) {
        console.log(
          `adding label ${
            tableColumns.find((col) => col.name === labelStyle.labelColumn)
              ?.values[rowId]
          }`
        );
        addSampleOrInterval(
          labelProperties.text,
          tableColumns.find((col) => col.name === labelStyle.labelColumn)
            ?.values[rowId],
          interval
        );
      }

      addSampleOrInterval(
        labelProperties.style,
        labelStyle.style === "OUTLINE"
          ? LabelStyle.OUTLINE
          : labelStyle.style === "FILL_AND_OUTLINE"
          ? LabelStyle.FILL_AND_OUTLINE
          : LabelStyle.FILL,
        interval
      );
      addSampleOrInterval(labelProperties.scale, labelStyle.scale, interval);
      addSampleOrInterval(
        labelProperties.fillColor,
        Color.fromCssColorString(labelStyle.fillColor),
        interval
      );
      addSampleOrInterval(
        labelProperties.outlineColor,
        Color.fromCssColorString(labelStyle.outlineColor),
        interval
      );
      addSampleOrInterval(
        labelProperties.outlineWidth,
        labelStyle.outlineWidth,
        interval
      );
      addSampleOrInterval(
        labelProperties.pixelOffset,
        new Cartesian2(labelStyle.pixelOffset[0], labelStyle.pixelOffset[1]),
        interval
      );
    }

    // Point trail symbolization
    if (trailProperties) {
      addSampleOrInterval(
        trailProperties.leadTime,
        trailStyle.leadTime,
        interval
      );
      addSampleOrInterval(
        trailProperties.trailTime,
        trailStyle.trailTime,
        interval
      );
      addSampleOrInterval(trailProperties.width, trailStyle.width, interval);
      addSampleOrInterval(
        trailProperties.resolution,
        trailStyle.resolution,
        interval
      );

      if (trailProperties.solidColor) {
        addSampleOrInterval(
          trailProperties.solidColor.color,
          Color.fromCssColorString(trailStyle.solidColor!.color),
          interval
        );
      }

      if (trailProperties.polylineGlow) {
        addSampleOrInterval(
          trailProperties.polylineGlow.color,
          Color.fromCssColorString(trailStyle.polylineGlow!.color),
          interval
        );
        addSampleOrInterval(
          trailProperties.polylineGlow.glowPower,
          trailStyle.polylineGlow?.glowPower,
          interval
        );
        addSampleOrInterval(
          trailProperties.polylineGlow.taperPower,
          trailStyle.polylineGlow?.taperPower,
          interval
        );
      }
    }

    // Feature properties/description
    addSampleOrInterval(
      properties,
      {
        ...getRowValues(rowId, tableColumns)
      },
      interval
    );
    addSampleOrInterval(
      description,
      getRowDescription(rowId, tableColumns),
      interval
    );
    availability.addInterval(interval);
  });

  const show = calculateShow(availability);
  const feature = new TerriaFeature({
    position: positionProperty,
    point: usePointGraphics
      ? new PointGraphics({
          color: colorProperty,
          outlineColor: outlineColorProperty,
          pixelSize: pointSizeProperty,
          show: show,
          outlineWidth: outlineWidthProperty,
          heightReference: HeightReference.CLAMP_TO_GROUND
        })
      : undefined,
    billboard: !usePointGraphics
      ? new BillboardGraphics({
          image: pointMarkerProperty,
          height: pointHeightProperty,
          width: pointWidthProperty,
          color: colorProperty,
          rotation: pointRotationProperty,
          pixelOffset: pointPixelOffsetProperty,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          show
        })
      : undefined,
    path: trailProperties
      ? new PathGraphics({
          show: true,
          leadTime: trailProperties.leadTime,
          trailTime: trailProperties.trailTime,
          resolution: trailProperties.resolution,
          width: trailProperties.width,

          material: trailProperties.polylineGlow
            ? new PolylineGlowMaterialProperty({
                color: trailProperties.polylineGlow.color,
                glowPower: trailProperties.polylineGlow.glowPower,
                taperPower: trailProperties.polylineGlow.taperPower
              })
            : trailProperties.solidColor
            ? new ColorMaterialProperty(trailProperties.solidColor.color)
            : undefined
        })
      : undefined,
    label: labelProperties
      ? new LabelGraphics({
          show: true,
          font: labelProperties.font,
          text: labelProperties.text,
          style: labelProperties.style,
          scale: labelProperties.scale,
          fillColor: labelProperties.fillColor,
          outlineColor: labelProperties.outlineColor,
          outlineWidth: labelProperties.outlineWidth,
          pixelOffset: labelProperties.pixelOffset
        })
      : undefined,

    availability
  });

  // Add properties to feature.data so we have access to TimeIntervalCollectionProperty outside of the PropertyBag.
  feature.data = {
    timeIntervalCollection: properties,
    rowIds,
    type: "terriaFeatureData"
  };
  feature.description = description;
  return feature;
}

function addSampleOrInterval(
  property:
    | SampledProperty
    | SampledPositionProperty
    | TimeIntervalCollectionProperty
    | TimeIntervalCollectionPositionProperty,
  data: any,
  interval: TimeInterval
) {
  if (
    property instanceof SampledProperty ||
    property instanceof SampledPositionProperty
  ) {
    property.addSample(interval.start, data);
  } else {
    const thisInterval = interval.clone();
    thisInterval.data = data;
    property.intervals.addInterval(thisInterval);
  }
}

function calculateShow(availability: TimeIntervalCollection) {
  const show = new TimeIntervalCollectionProperty();
  if (availability.start) {
    const start = availability.start;
    const stop = availability.stop;
    show.intervals.addInterval(
      new TimeInterval({
        start: <any>Iso8601.MINIMUM_VALUE,
        stop: <any>Iso8601.MAXIMUM_VALUE,
        data: false
      })
    );
    show.intervals.addInterval(new TimeInterval({ start, stop, data: true }));
  } else {
    show.intervals.addInterval(
      new TimeInterval({
        start: <any>Iso8601.MINIMUM_VALUE,
        stop: <any>Iso8601.MAXIMUM_VALUE,
        data: true
      })
    );
  }
  return show;
}

function getRowDescription(
  index: number,
  tableColumns: Readonly<TableColumn[]>
) {
  const rows = tableColumns
    .map((column) => {
      const title = column.title;
      const value = column.valueFunctionForType(index);
      return `<tr><td>${title}</td><td>${value}</td></tr>`;
    })
    .join("\n");
  return `<table class="cesium-infoBox-defaultTable">${rows}</table>`;
}
