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
  poiDomainStyleGroups?: PoiDomainStyleGroup[];
  scaleField?: string;
  domainIdField?: string;
}

const VERTICAL_ORIGIN = new ConstantProperty(VerticalOrigin.BOTTOM);
const HEIGHT_REFERENCE = new ConstantProperty(HeightReference.CLAMP_TO_GROUND);
const EYE_OFFSET = new ConstantProperty(new Cartesian3(0, 0, -12));
const DEPTH_TEST_DISTANCE = new ConstantProperty(Number.POSITIVE_INFINITY);

type PoiDomainStyle = { symbol: string; color?: string };

const MARKER_IMAGE_CACHE = new Map<
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
    ? group.domainIds.map((x: any) => Number(x)).filter(Number.isFinite)
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
  const poiDomainStyleGroups = (
    options?.poiDomainStyleGroups?.length
      ? options.poiDomainStyleGroups
      : getDefaultPoiDomainStyleGroups()
  ).map(normalizePoiDomainStyleGroup);
  const scaleField =
    options?.scaleField ?? defaultRerPoiCatalogItemTraits.scaleField;
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

        if (imageResult) {
          const createBillboard = (img: HTMLCanvasElement) => {
            entity.billboard = new BillboardGraphics({
              image: new ConstantProperty(img),
              verticalOrigin: VERTICAL_ORIGIN,
              heightReference: HEIGHT_REFERENCE,
              width: new ConstantProperty(markerSize),
              height: new ConstantProperty(markerSize),
              eyeOffset: EYE_OFFSET,
              distanceDisplayCondition: visibilityProp,
              disableDepthTestDistance: DEPTH_TEST_DISTANCE
            });
            entity.point = undefined;
          };

          if (imageResult instanceof Promise) {
            imageResult.then(createBillboard);
          } else {
            createBillboard(imageResult);
          }
        }
      }

      entity.label = undefined;
    }
  } finally {
    dataSource.entities.resumeEvents();
  }
}
