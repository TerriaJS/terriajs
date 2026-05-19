import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import DistanceDisplayCondition from "terriajs-cesium/Source/Core/DistanceDisplayCondition";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
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
type LabelStyle = {
  labelTextColor: string;
  labelFontSize: number;
  labelOutlineWidth: number;
  labelOutlineColor: string;
};

const MARKER_IMAGE_CACHE = new Map<
  string,
  HTMLCanvasElement | Promise<HTMLCanvasElement>
>();
const COMPOSITE_IMAGE_CACHE = new Map<
  string,
  HTMLCanvasElement | Promise<HTMLCanvasElement>
>();
const pinBuilder = new PinBuilder();

function getPinImage(
  iconId: string,
  color: string,
  markerSize: number,
  iconStrokeWidth: number,
  iconStrokeColor: string
): HTMLCanvasElement | Promise<HTMLCanvasElement> | undefined {
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
    image.then((canvas: HTMLCanvasElement) => {
      MARKER_IMAGE_CACHE.set(key, canvas);
    });
  }

  MARKER_IMAGE_CACHE.set(key, image);
  return image;
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

function measureTextMetrics(
  ctx: CanvasRenderingContext2D,
  text: string
): { width: number; height: number } {
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent ?? 10;
  const descent = metrics.actualBoundingBoxDescent ?? 3;
  return {
    width: metrics.width,
    height: ascent + descent
  };
}

function buildCompositeMarkerImage(
  pinImage: HTMLCanvasElement,
  labelText: string,
  markerSize: number,
  labelStyle: LabelStyle
): HTMLCanvasElement {
  const {
    labelTextColor,
    labelFontSize,
    labelOutlineWidth,
    labelOutlineColor
  } = labelStyle;
  const cacheKey = [
    pinImage.width,
    pinImage.height,
    labelText,
    markerSize,
    labelTextColor,
    labelFontSize,
    labelOutlineWidth,
    labelOutlineColor
  ].join("|");

  const cached = COMPOSITE_IMAGE_CACHE.get(cacheKey);
  if (cached instanceof HTMLCanvasElement) {
    return cached;
  }

  const textCanvas = document.createElement("canvas");
  const textCtx = textCanvas.getContext("2d");
  if (!textCtx) {
    return pinImage;
  }

  const font = `${labelFontSize}px sans-serif`;
  textCtx.font = font;

  const paddingX = 6;
  const paddingY = 4;
  const gap = 6;
  const maxTextWidth = 220;

  const lines: string[] = [];
  const words = labelText.trim().split(/\s+/);
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

  if (lines.length === 0) {
    lines.push(labelText);
  }

  const lineMetrics = lines.map((line) => measureTextMetrics(textCtx, line));
  const textWidth =
    Math.max(...lineMetrics.map((m) => m.width), 0) + paddingX * 2;
  const textHeight =
    lineMetrics.reduce((sum, m) => sum + m.height, 0) +
    paddingY * 2 +
    Math.max(0, lines.length - 1) * 2;

  const canvasWidth = Math.max(pinImage.width, Math.ceil(textWidth));
  const canvasHeight = Math.ceil(textHeight) + gap + pinImage.height;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return pinImage;
  }

  ctx.imageSmoothingEnabled = true;

  // Draw text at the top.
  ctx.font = font;
  ctx.fillStyle = labelTextColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Optional outline for readability without a background box.
  ctx.strokeStyle = labelOutlineColor;
  ctx.lineWidth = labelOutlineWidth;
  ctx.lineJoin = "round";
  let y = paddingY;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const metrics = lineMetrics[i];

    ctx.strokeText(line, canvasWidth / 2, y);
    ctx.fillText(line, canvasWidth / 2, y);

    y += metrics.height + 2;
  }

  // Draw the pin below the text.
  const pinX = Math.floor((canvasWidth - pinImage.width) / 2);
  const pinY = Math.ceil(textHeight) + gap;
  ctx.drawImage(pinImage, pinX, pinY);

  COMPOSITE_IMAGE_CACHE.set(cacheKey, canvas);
  return canvas;
}

export function applyRerPoiEntityStyles(
  dataSource: GeoJsonDataSource,
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
  const labelStyle: LabelStyle = {
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
  const entities = dataSource.entities.values;
  const now = JulianDate.now();

  dataSource.entities.suspendEvents();
  try {
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
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
          const createBillboard = (img: HTMLCanvasElement) => {
            const finalImage =
              name && showLabels
                ? buildCompositeMarkerImage(img, name, markerSize, labelStyle)
                : img;

            entity.billboard = new BillboardGraphics({
              image: new ConstantProperty(finalImage),
              verticalOrigin: BILLBOARD_VERTICAL_ORIGIN,
              heightReference: HEIGHT_REFERENCE,
              eyeOffset: EYE_OFFSET,
              distanceDisplayCondition: visibilityProp,
              disableDepthTestDistance: DEPTH_TEST_DISTANCE
            });

            entity.label = undefined;
            entity.point = undefined;
          };

          if (imageResult instanceof Promise) {
            imageResult.then(createBillboard);
          } else {
            createBillboard(imageResult);
          }
        }
      }
    }
  } finally {
    dataSource.entities.resumeEvents();
  }
}
