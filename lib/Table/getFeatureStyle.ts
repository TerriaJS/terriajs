import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Color from "terriajs-cesium/Source/Core/Color";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import LabelGraphics from "terriajs-cesium/Source/DataSources/LabelGraphics";
import PathGraphics from "terriajs-cesium/Source/DataSources/PathGraphics";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import Property from "terriajs-cesium/Source/DataSources/Property";
import LabelStyle from "terriajs-cesium/Source/Scene/LabelStyle";
import { getMakiIcon, isMakiIcon } from "../Map/Icons/Maki/MakiIcons";
import TableStyle from "./TableStyle";
import { isConstantStyleMap } from "./TableStyleMap";

/** Type to exclude CesiumProperty types in a given Object.
 * For example:
 * ```ts
 * ExcludeCesiumProperty<{someKey: string | Property}>
 * => {someKey: string}
 * ```
 *
 * This is useful when creating style options for cesium primitives (eg PointGraphics, LabelGraphics, ...), as it means we can directly pass these options into cesium primitive constructors (eg new PointGraphics(options)) OR we can turn style options into `SampledProperty` or `TimeIntervalCollectionProperty` (which is required for `createLongitudeLatitudeFeaturePerId`)
 */
type ExcludeCesiumProperty<T> = {
  [key in keyof T]: Exclude<T[key], Property>;
};

// The following "Supported*" types contain all supported properties for different cesium primitives.
// The are used to transform TableStyleTraits into applicable constructor options for cesium primitives:
// - For example - TableLabelStyleTraits are transformed into LabelGraphics.ConstructorOptions
// The `ExcludeCesiumProperty` is used here because all "*.ConstructorOptions" properties allow Cesium.Property values - which we don't want.

export type SupportedPointGraphics = Pick<
  ExcludeCesiumProperty<PointGraphics.ConstructorOptions>,
  "color" | "outlineColor" | "pixelSize" | "outlineWidth"
>;

export type SupportedBillboardGraphics = Pick<
  ExcludeCesiumProperty<BillboardGraphics.ConstructorOptions>,
  "image" | "color" | "width" | "height" | "rotation" | "pixelOffset"
>;

export type SupportedPathGraphics = Pick<
  ExcludeCesiumProperty<PathGraphics.ConstructorOptions>,
  "leadTime" | "trailTime" | "width" | "resolution"
>;

export interface SupportedSolidColorMaterial {
  color: Color;
}
export interface SupportedPolylineGlowMaterial {
  color: Color;
  glowPower?: number;
  taperPower?: number;
}

export type SupportedLabelGraphics = Pick<
  ExcludeCesiumProperty<LabelGraphics.ConstructorOptions>,
  | "font"
  | "text"
  | "style"
  | "scale"
  | "fillColor"
  | "outlineColor"
  | "outlineWidth"
  | "pixelOffset"
>;

/** For given TableStyle and rowId, return feature styling in a "cesium-friendly" format.
 * It returns style options for the following
 * - PointGraphics (for point marker)
 * - BillboardGraphics (for custom marker)
 * - PathGraphics (referred to as "trail" in Traits system)
 * - LabelGraphics
 * - `usePointGraphics` flag - whether to use PointGraphics or BillboardGraphics for marker symbology
 */
export function getFeatureStyle(style: TableStyle, rowId: number) {
  const color =
    style.colorMap.mapValueToColor(style.colorColumn?.valuesForType[rowId]) ??
    null;

  const pointSize =
    style.pointSizeColumn !== undefined
      ? style.pointSizeMap.mapValueToPointSize(
          style.pointSizeColumn.valueFunctionForType(rowId)
        )
      : undefined;

  const pointStyleTraits = isConstantStyleMap(style.pointStyleMap.styleMap)
    ? style.pointStyleMap.styleMap.style
    : style.pointStyleMap.styleMap.mapValueToStyle(rowId);

  const outlineStyle = isConstantStyleMap(style.outlineStyleMap.styleMap)
    ? style.outlineStyleMap.styleMap.style
    : style.outlineStyleMap.styleMap.mapValueToStyle(rowId);

  // If no outline color is defined in traits, use current basemap contrast color
  const outlineColor = Color.fromCssColorString(
    outlineStyle.color ?? style.tableModel.terria.baseMapContrastColor
  );

  // Convert TablePointStyleTraits (and TableColorStyleTraits, TableOutlineStyleTraits, TablePointSizeStyleTraits) into PointGraphics options
  const pointGraphicsOptions: ExcludeCesiumProperty<SupportedPointGraphics> = {
    color: color,
    pixelSize: pointSize ?? pointStyleTraits.height ?? pointStyleTraits.width,
    outlineWidth: outlineStyle.width,
    outlineColor: outlineColor
  };

  // Convert TablePointStyleTraits (and TableColorStyleTraits, TableOutlineStyleTraits, TablePointSizeStyleTraits) into a Maki Icon
  // This returns SVG string
  const makiIcon = getMakiIcon(
    pointStyleTraits.marker ?? "circle",
    color.toCssColorString(),
    outlineStyle.width ?? 1,
    outlineColor.toCssColorString(),
    pointSize ?? pointStyleTraits.height ?? 24,
    pointSize ?? pointStyleTraits.width ?? 24
  );

  // Convert TablePointStyleTraits (and TableColorStyleTraits, TableOutlineStyleTraits, TablePointSizeStyleTraits) into BillboardGraphics options
  const billboardGraphicsOptions: SupportedBillboardGraphics = {
    image: makiIcon ?? pointStyleTraits.marker,
    // Only add color property for non maki icons - as we color maki icons directly (see `makiIcon = getMakiIcon(...)`)
    color: !makiIcon ? color : Color.WHITE,
    width: pointSize ?? pointStyleTraits.width,
    height: pointSize ?? pointStyleTraits.height,
    rotation: CesiumMath.toRadians(360 - (pointStyleTraits.rotation ?? 0)),
    pixelOffset: new Cartesian2(
      pointStyleTraits.pixelOffset?.[0],
      pointStyleTraits.pixelOffset?.[1]
    )
  };

  // Convert TableTrailStyleTraits into PathGraphics options
  // We also have two supported materials
  // - PolylineGlowMaterialTraits -> PolylineGlowMaterial options
  // - SolidColorMaterialTraits -> ColorMaterialProperty options
  const trailStyleTraits = isConstantStyleMap(style.trailStyleMap.styleMap)
    ? style.trailStyleMap.styleMap.style
    : style.trailStyleMap.styleMap.mapValueToStyle(rowId);

  const pathGraphicsOptions: SupportedPathGraphics = {
    ...trailStyleTraits
  };

  const pathGraphicsSolidColorOptions: SupportedSolidColorMaterial = {
    color: Color.fromCssColorString(trailStyleTraits.solidColor!.color)
  };

  const pathGraphicsPolylineGlowOptions: SupportedPolylineGlowMaterial = {
    ...trailStyleTraits.polylineGlow,
    color: Color.fromCssColorString(trailStyleTraits.polylineGlow!.color)
  };

  const labelStyleTraits = isConstantStyleMap(style.labelStyleMap.styleMap)
    ? style.labelStyleMap.styleMap.style
    : style.labelStyleMap.styleMap.mapValueToStyle(rowId);

  // Convert TableLabelStyleTraits to LabelGraphics options
  const labelGraphicsOptions: SupportedLabelGraphics = {
    ...labelStyleTraits,
    text: style.tableModel.tableColumns.find(
      (col) => col.name === labelStyleTraits.labelColumn
    )?.values[rowId],
    style:
      labelStyleTraits.style === "OUTLINE"
        ? LabelStyle.OUTLINE
        : labelStyleTraits.style === "FILL_AND_OUTLINE"
        ? LabelStyle.FILL_AND_OUTLINE
        : LabelStyle.FILL,
    fillColor: Color.fromCssColorString(labelStyleTraits.fillColor),
    outlineColor: Color.fromCssColorString(labelStyleTraits.outlineColor),
    pixelOffset: new Cartesian2(
      labelStyleTraits.pixelOffset[0],
      labelStyleTraits.pixelOffset[1]
    )
  };

  return {
    labelGraphicsOptions,
    pointGraphicsOptions,
    pathGraphicsOptions,
    pathGraphicsSolidColorOptions,
    pathGraphicsPolylineGlowOptions,
    billboardGraphicsOptions,
    /** Use PointGraphics instead of BillboardGraphics, if not using maki icon. */
    usePointGraphics: !isMakiIcon(pointStyleTraits.marker)
  };
}
