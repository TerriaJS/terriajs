import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import DistanceDisplayCondition from "terriajs-cesium/Source/Core/DistanceDisplayCondition";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import LabelGraphics from "terriajs-cesium/Source/DataSources/LabelGraphics";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import LabelStyle from "terriajs-cesium/Source/Scene/LabelStyle";
import VerticalOrigin from "terriajs-cesium/Source/Scene/VerticalOrigin";
import PinBuilder from "terriajs-cesium/Source/Core/PinBuilder";
import { getMakiIcon } from "../Map/Icons/Maki/MakiIcons";
import {
  defaultRerPoiCatalogItemTraits,
  PoiDomainStyleGroup
} from "../Traits/TraitsClasses/RerPoiCatalogItemTraits";
import isDefined from "../Core/isDefined";

export const RER_POI_CATALOG_ITEM_TYPE = "rer-poi";
export const RER_POI_URL_REGEX =
  /^https?:\/\/servizigis\.regione\.emilia-romagna\.it\/geoags\/rest\/services\/portale\/rer3d_poi\/MapServer\/0$/i;

export function normalizeRerPoiUrl(url: string | undefined): string {
  return (url ?? "")
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\/query\/?$/i, "")
    .replace(/\/+$/, "");
}

export function isRerPoiUrl(url: string | undefined): boolean {
  return RER_POI_URL_REGEX.test(normalizeRerPoiUrl(url));
}

export interface RerPoiStylingOptions {
  defaultMarkerColor?: string;
  markerSize?: number;
  iconStrokeWidth?: number;
  iconStrokeColor?: string;
  showLabels?: boolean;
  labelTextColor?: string;
  labelFontSize?: number;
  labelOutlineWidth?: number;
  labelOutlineColor?: string;
  poiDomainStyleGroups?: PoiDomainStyleGroup[];
  scaleField?: string;
  domainIdField?: string;
  nameField?: string;
}

const BILLBOARD_VERTICAL_ORIGIN = new ConstantProperty(VerticalOrigin.BOTTOM);
const HEIGHT_REFERENCE = new ConstantProperty(HeightReference.CLAMP_TO_GROUND);
const EYE_OFFSET = new ConstantProperty(new Cartesian3(0, 0, -12));
const DEPTH_TEST_DISTANCE = new ConstantProperty(Number.POSITIVE_INFINITY);

type PoiDomainStyle = { symbol: string; color?: string };
type LabelStyleOptions = {
  labelTextColor: string;
  labelFontSize: number;
  labelOutlineWidth: number;
  labelOutlineColor: string;
};

// Use base64 Data URLs strings instead of HTMLCanvasElement to prevent browser VRAM eviction (black icons)
const MARKER_IMAGE_CACHE = new Map<string, string | Promise<string>>();
const pinBuilder = new PinBuilder();

function getPinImage(
  iconId: string,
  color: string,
  markerSize: number,
  iconStrokeWidth: number,
  iconStrokeColor: string
): string | Promise<string> | undefined {
  const key = [
    iconId,
    color,
    markerSize,
    iconStrokeWidth,
    iconStrokeColor
  ].join("|");

  const cached = MARKER_IMAGE_CACHE.get(key);
  if (cached) {
    return cached;
  }

  const svgUrl = getMakiIcon(
    iconId,
    "#ffffff",
    iconStrokeWidth,
    iconStrokeColor,
    24,
    24
  );

  if (!svgUrl) {
    return undefined;
  }

  const pinColor = Color.fromCssColorString(color);
  const image = pinBuilder.fromUrl(svgUrl, pinColor, markerSize) as
    | HTMLCanvasElement
    | Promise<HTMLCanvasElement>;

  if (image instanceof Promise) {
    const stringPromise = image.then((canvas: HTMLCanvasElement) => {
      const dataUrl = canvas.toDataURL();
      MARKER_IMAGE_CACHE.set(key, dataUrl);
      return dataUrl;
    });
    MARKER_IMAGE_CACHE.set(key, stringPromise);
    return stringPromise;
  }

  const dataUrl = image.toDataURL();
  MARKER_IMAGE_CACHE.set(key, dataUrl);
  return dataUrl;
}

function getVisibilityRange(
  scaleValue: unknown
): DistanceDisplayCondition | undefined {
  const maxDistance = Number(scaleValue);
  return Number.isFinite(maxDistance)
    ? new DistanceDisplayCondition(0, maxDistance)
    : undefined;
}

function normalizePoiDomainStyleGroup(
  group: Partial<PoiDomainStyleGroup>
): PoiDomainStyleGroup {
  const normalized = new PoiDomainStyleGroup();

  normalized.id = typeof group.id === "string" ? group.id : "";
  normalized.symbol =
    typeof group.symbol === "string" && group.symbol.trim()
      ? group.symbol.trim()
      : "marker";
  normalized.color =
    typeof group.color === "string" && group.color.trim()
      ? group.color.trim()
      : undefined;
  normalized.domainIds = Array.isArray(group.domainIds)
    ? group.domainIds.map((x) => Number(x)).filter(Number.isFinite)
    : [];

  return normalized;
}

function getDefaultPoiDomainStyleGroups(): PoiDomainStyleGroup[] {
  return (defaultRerPoiCatalogItemTraits.poiDomainStyleGroups ?? []).map(
    normalizePoiDomainStyleGroup
  );
}

function buildPoiDomainStyleMap(
  groups: PoiDomainStyleGroup[]
): Record<number, PoiDomainStyle> {
  return groups.reduce<Record<number, PoiDomainStyle>>((acc, group) => {
    for (const domainId of group.domainIds ?? []) {
      acc[domainId] = {
        symbol: group.symbol,
        color: group.color
      };
    }
    return acc;
  }, {});
}

function getRerPoiIconId(symbol: unknown): string {
  return typeof symbol === "string" && symbol.trim() ? symbol.trim() : "marker";
}

// Replaces the heavy text-on-canvas drawing with simple line-breaking for Cesium's native LabelGraphics
function wrapTextForCesiumLabel(labelText: string, fontSize: number): string {
  const textCanvas = document.createElement("canvas");
  const textCtx = textCanvas.getContext("2d");
  if (!textCtx) return labelText;

  textCtx.font = `${fontSize}px sans-serif`;
  const maxTextWidth = 220;
  const words = labelText.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (textCtx.measureText(testLine).width > maxTextWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

export function applyRerPoiEntityStyles(
  dataSource: GeoJsonDataSource,
  entitiesToStyle: any[], // Accepts only the targeted entities to prevent rebuilding the whole list
  options?: RerPoiStylingOptions
): void {
  const defaultMarkerColor =
    options?.defaultMarkerColor ??
    defaultRerPoiCatalogItemTraits.defaultMarkerColor;
  const markerSize =
    options?.markerSize ?? defaultRerPoiCatalogItemTraits.markerSize;
  const iconStrokeWidth =
    options?.iconStrokeWidth ?? defaultRerPoiCatalogItemTraits.iconStrokeWidth;
  const iconStrokeColor =
    options?.iconStrokeColor ?? defaultRerPoiCatalogItemTraits.iconStrokeColor;
  const showLabels =
    options?.showLabels ?? defaultRerPoiCatalogItemTraits.showLabels;
  const labelStyle: LabelStyleOptions = {
    labelTextColor:
      options?.labelTextColor ?? defaultRerPoiCatalogItemTraits.labelTextColor,
    labelFontSize:
      options?.labelFontSize ?? defaultRerPoiCatalogItemTraits.labelFontSize,
    labelOutlineWidth:
      options?.labelOutlineWidth ??
      defaultRerPoiCatalogItemTraits.labelOutlineWidth,
    labelOutlineColor:
      options?.labelOutlineColor ??
      defaultRerPoiCatalogItemTraits.labelOutlineColor
  };
  const poiDomainStyleGroups = (
    options?.poiDomainStyleGroups?.length
      ? options.poiDomainStyleGroups
      : getDefaultPoiDomainStyleGroups()
  ).map(normalizePoiDomainStyleGroup);
  const scaleField =
    options?.scaleField ?? defaultRerPoiCatalogItemTraits.scaleField;
  const nameField =
    options?.nameField ?? defaultRerPoiCatalogItemTraits.nameField;
  const domainIdField =
    options?.domainIdField ?? defaultRerPoiCatalogItemTraits.domainIdField;

  const poiDomainIconMap = buildPoiDomainStyleMap(poiDomainStyleGroups);
  const now = JulianDate.now();

  dataSource.entities.suspendEvents();
  try {
    for (let i = 0; i < entitiesToStyle.length; i++) {
      const entity = entitiesToStyle[i];
      const properties = entity.properties;

      const visibilityRange = getVisibilityRange(
        properties?.[scaleField]?.getValue(now)
      );
      const visibilityProp = visibilityRange
        ? new ConstantProperty(visibilityRange)
        : undefined;

      if (entity.position) {
        const rawDomainValue = properties?.[domainIdField]?.getValue(now);
        const domainId = Number(rawDomainValue);
        const mapped = Number.isFinite(domainId)
          ? poiDomainIconMap[domainId]
          : undefined;

        const symbol = getRerPoiIconId(mapped?.symbol);
        const color = mapped?.color ?? defaultMarkerColor;

        const imageResult = getPinImage(
          symbol,
          color,
          markerSize,
          iconStrokeWidth,
          iconStrokeColor
        );

        const rawName = properties?.[nameField]?.getValue(now);
        const name =
          isDefined(rawName) && String(rawName).trim().length > 0
            ? String(rawName).trim()
            : undefined;

        if (imageResult) {
          const createVisuals = (imgDataUrl: string) => {
            // Anti-Ghosting Check: If the user toggled the filter rapidly, 
            // this entity might have been removed before the Promise resolved.
            if (!dataSource.entities.contains(entity)) return;

            entity.billboard = new BillboardGraphics({
              image: new ConstantProperty(imgDataUrl),
              verticalOrigin: BILLBOARD_VERTICAL_ORIGIN,
              heightReference: HEIGHT_REFERENCE,
              eyeOffset: EYE_OFFSET,
              distanceDisplayCondition: visibilityProp,
              disableDepthTestDistance: DEPTH_TEST_DISTANCE
            });

            if (name && showLabels) {
              const multiLineText = wrapTextForCesiumLabel(
                name,
                labelStyle.labelFontSize
              );

              entity.label = new LabelGraphics({
                text: new ConstantProperty(multiLineText),
                font: new ConstantProperty(`${labelStyle.labelFontSize}px sans-serif`),
                fillColor: new ConstantProperty(Color.fromCssColorString(labelStyle.labelTextColor)),
                outlineColor: new ConstantProperty(Color.fromCssColorString(labelStyle.labelOutlineColor)),
                outlineWidth: new ConstantProperty(labelStyle.labelOutlineWidth),
                style: new ConstantProperty(LabelStyle.FILL_AND_OUTLINE),
                verticalOrigin: new ConstantProperty(VerticalOrigin.BOTTOM),
                pixelOffset: new ConstantProperty(new Cartesian2(0, -markerSize - 6)),
                heightReference: HEIGHT_REFERENCE,
                eyeOffset: EYE_OFFSET,
                distanceDisplayCondition: visibilityProp,
                disableDepthTestDistance: DEPTH_TEST_DISTANCE
              });
            } else {
              entity.label = undefined;
            }

            entity.point = undefined;
          };

          if (imageResult instanceof Promise) {
            imageResult.then(createVisuals);
          } else {
            createVisuals(imageResult);
          }
        }
      }
    }
  } finally {
    dataSource.entities.resumeEvents();
  }
}
