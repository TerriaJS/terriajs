import { isViewerMode, MapViewers } from "./ViewerMode";

export type PersistedSettings = {
  /** Map viewer mode key ("2d" | "3d" | "3dsmooth"), or undefined if not specified */
  viewerMode?: keyof typeof MapViewers;
  /** Unique ID of the persisted base map, or undefined if not specified */
  baseMapId?: string;
  /** Whether to use native resolution, or undefined if not specified */
  useNativeResolution?: boolean;
  /** Base maximum screen space error, or undefined if not specified */
  baseMaximumScreenSpaceError?: number;
  /** Whether to shorten share URLs, or undefined if not specified */
  shortenShareUrls?: boolean;
};

/**
 * Reads persisted config from localStorage into a single object.
 *
 * @param getLocalProp - Abstraction over localStorage so this stays testable
 *   without DOM. Pass `(key) => terria.localStorage.getItem(key)` at the call site.
 * @param persistViewerMode - When false, viewerMode is excluded (controlled by
 *   TerriaConfig.persistViewerMode).
 */
export function readLocalStorageSettings(
  getLocalProp: (key: string) => string | boolean | null,
  persistViewerMode: boolean
): PersistedSettings {
  const rawViewerMode = getLocalProp("viewermode");
  const viewerMode =
    persistViewerMode &&
    typeof rawViewerMode === "string" &&
    isViewerMode(rawViewerMode)
      ? rawViewerMode
      : undefined;

  const useNativeResolution = getLocalProp("useNativeResolution");
  const shortenShareUrls = getLocalProp("shortenShareUrls");
  const rawError = getLocalProp("baseMaximumScreenSpaceError")?.toString();
  const baseMaximumScreenSpaceError =
    rawError !== undefined ? parseFloat(rawError) : NaN;

  const rawBaseMapId = getLocalProp("basemap");
  const baseMapId =
    typeof rawBaseMapId === "string" && rawBaseMapId.length > 0
      ? rawBaseMapId
      : undefined;

  return {
    useNativeResolution:
      typeof useNativeResolution === "boolean"
        ? useNativeResolution
        : undefined,
    baseMaximumScreenSpaceError: !isNaN(baseMaximumScreenSpaceError)
      ? baseMaximumScreenSpaceError
      : undefined,
    shortenShareUrls:
      typeof shortenShareUrls === "boolean" ? shortenShareUrls : undefined,

    viewerMode,
    baseMapId
  };
}
