import { RectangleCoordinates } from "../../Models/FunctionParameters/RectangleParameter";
import loadJson from "../../Core/loadJson";

export type MicrozonationRecord = {
  id?: string | number;
  province?: string;
  municipality?: string;
  microzonation?: string;
  msOrdinance?: string;
  cle?: string;
  cleOrdinance?: string;
  municipalPlan?: string;
  [key: string]: unknown;
};

export type MicrozonationDetail = {
  generalInfo: {
    province?: string;
    municipality?: string;
    istatCode?: string;
    notes?: string;
  };
  microzonation: {
    microzonation?: string;
    msOrdinance?: string;
    msValidation?: string;
    msStandard?: string;
    microzonationInfo?: string;
  };
  cle: {
    cle?: string;
    cleOrdinance?: string;
    cleValidation?: string;
    cleStandard?: string;
  };
  civilProtectionPlan: {
    municipalPlan?: string;
    link?: string;
  };
};

export type Filters = {
  province: string;
  municipality: string;
  microzonation: string;
  cle: string;
};

export type WfsConfig = {
  url: string;
  typeName: string;
  maxFeatures?: number;
  outputFormat?: string;
};

const flattenCoordinates = (coords: any): number[][] => {
  if (typeof coords[0] === "number") {
    return [coords as number[]];
  }
  const result: number[][] = [];
  for (const item of coords) {
    result.push(...flattenCoordinates(item));
  }
  return result;
};

export const computeGeometryBBox = (
  geometry: any
): RectangleCoordinates | undefined => {
  if (!geometry || !geometry.coordinates) return undefined;
  const coords = flattenCoordinates(geometry.coordinates);
  if (coords.length === 0) return undefined;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lon, lat] of coords) {
    if (lon < west) west = lon;
    if (lon > east) east = lon;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return { west, south, east, north };
};

export const emptyFilters: Filters = {
  province: "",
  municipality: "",
  microzonation: "",
  cle: ""
};

export const uniqueSorted = (values: Array<string | undefined>) =>
  Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  ).sort((a, b) => a.localeCompare(b));

export const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

export const normalizeMicrozonationLevel = (value: unknown): string => {
  const s = String(value ?? "").trim();
  if (s === "1" || s === "2" || s === "3") return s;
  return "no";
};

export const normalizeCleStatus = (value: unknown): string => {
  const s = String(value ?? "")
    .trim()
    .toUpperCase();
  return s === "S" ? "done" : "no";
};

export const getRecordId = (record: MicrozonationRecord) =>
  record.id ??
  `${record.province ?? ""}-${record.municipality ?? ""}-${
    record.microzonation ?? ""
  }-${record.cle ?? ""}`;

export const filterRecords = (
  records: MicrozonationRecord[],
  filters: Filters
) =>
  records.filter((record) => {
    if (filters.province && record.province !== filters.province) {
      return false;
    }
    if (filters.municipality && record.municipality !== filters.municipality) {
      return false;
    }
    if (
      filters.microzonation &&
      record.microzonation !== filters.microzonation
    ) {
      return false;
    }
    if (filters.cle && record.cle !== filters.cle) {
      return false;
    }
    return true;
  });

export const normalizeRecord = (properties: any): MicrozonationRecord => ({
  id: properties?.id_stato_progetto ?? properties?.gid,
  province: properties?.prov ?? "",
  municipality: properties?.comune ?? "",
  microzonation: normalizeMicrozonationLevel(properties?.microzonazione),
  msOrdinance: properties?.ordinanza ?? "",
  cle: normalizeCleStatus(properties?.cle_convalida),
  cleOrdinance: properties?.cle_ordinanza ?? "",
  municipalPlan: properties?.piano_prot_civile ?? ""
});

export const normalizeDetail = (properties: any): MicrozonationDetail => ({
  generalInfo: {
    province: properties?.prov ?? "",
    municipality: properties?.comune ?? "",
    istatCode:
      properties?.cod_istat !== null && properties?.cod_istat !== undefined
        ? String(properties.cod_istat)
        : "",
    notes: properties?.note ?? ""
  },
  microzonation: {
    microzonation: normalizeMicrozonationLevel(properties?.microzonazione),
    msOrdinance: properties?.ordinanza ?? "",
    msValidation: properties?.convalidato ?? "",
    msStandard: properties?.mzs_standard ?? "",
    microzonationInfo: properties?.microzonazione_info ?? ""
  },
  cle: {
    cle: normalizeCleStatus(properties?.cle_convalida),
    cleOrdinance: properties?.cle_ordinanza ?? "",
    cleValidation: properties?.cle_convalida ?? "",
    cleStandard: properties?.cle_standard ?? ""
  },
  civilProtectionPlan: {
    municipalPlan: properties?.piano_prot_civile ?? "",
    link: properties?.link_ppc_comune ?? ""
  }
});

const buildWfsUrl = (config: WfsConfig): string => {
  const baseUrl = config.url;
  const params: Record<string, string> = {
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName: config.typeName,
    outputFormat: config.outputFormat ?? "application/json",
    srsName: "EPSG:4326"
  };
  if (config.maxFeatures) {
    params.maxFeatures = String(config.maxFeatures);
  }
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const separator = baseUrl.includes("?") ? "&" : "?";
  const fullUrl = `${baseUrl}${separator}${queryString}`;

  return fullUrl;
};

export const fetchWfsFeatures = async (
  config: WfsConfig | undefined
): Promise<{
  records: MicrozonationRecord[];
  propertiesById: Map<string | number, any>;
  geometryById: Map<string | number, any>;
}> => {
  if (!config) {
    return {
      records: [],
      propertiesById: new Map(),
      geometryById: new Map()
    };
  }
  const url = buildWfsUrl(config);
  const json = await loadJson(url);
  const features: any[] = json?.features ?? [];

  const records: MicrozonationRecord[] = [];
  const propertiesById = new Map<string | number, any>();
  const geometryById = new Map<string | number, any>();

  for (const feature of features) {
    const props = feature?.properties ?? {};
    const record = normalizeRecord(props);
    records.push(record);
    if (record.id !== null && record.id !== undefined) {
      propertiesById.set(record.id, props);
      if (feature?.geometry) {
        geometryById.set(record.id, feature.geometry);
      }
    }
  }

  return { records, propertiesById, geometryById };
};

export const getDetailFromProperties = (
  propertiesById: Map<string | number, any>,
  record: MicrozonationRecord
): MicrozonationDetail => {
  const props =
    (record.id !== null && record.id !== undefined
      ? propertiesById.get(record.id)
      : undefined) ?? {};
  return normalizeDetail(props);
};
