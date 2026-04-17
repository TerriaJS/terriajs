import isDefined from "../Core/isDefined";
import { isViewerMode, MapViewers } from "./ViewerMode";

/**
 * All URL hash parameters parsed into a single typed object.
 *
 * Named special params are lifted into explicit fields; everything else falls
 * into `initFragments` (empty-value keys → init source file names) or
 * `extra` (unknown keys with values — forwarded in share links).
 */
export type HashParams = {
  /** `#clean` was present — clears all init sources on load */
  clean: boolean | undefined;
  /** `#hideWelcomeMessage` was present */
  hideWelcomeMessage: boolean | undefined;
  /** Validated viewer mode from `#map=2d|3d|3dsmooth`, or undefined */
  map: keyof typeof MapViewers | undefined;
  /** Raw value of `#ignoreErrors=`, or undefined */
  ignoreErrors: boolean | undefined;
  /** Raw value of `#hideWorkbench=`, or undefined */
  hideWorkbench: boolean | undefined;
  /** Raw value of `#hideExplorerPanel=`, or undefined */
  hideExplorerPanel: boolean | undefined;
  /** Config URL from `#configUrl=`, or undefined */
  configUrl: string | undefined;
  /** Raw JSON string from `#start=`, or undefined */
  start: string | undefined;
  /** Share key from `#share=`, or undefined */
  share: string | undefined;
  /** Keys with no value — each becomes an init source file name */
  initFragments: string[];
  /** Activate additional tools menu */
  tools: boolean | undefined;
  /** All remaining unknown keys that have values */
  extra: Record<string, string>;
};

const KNOWN_KEYS = new Set([
  "clean",
  "hideWelcomeMessage",
  "map",
  "ignoreErrors",
  "hideWorkbench",
  "hideExplorerPanel",
  "configUrl",
  "start",
  "share",
  "tools"
]);

const toBoolean = (value: string | undefined): boolean | undefined => {
  if (value === undefined) return undefined;
  return value === "1" || value.toLowerCase() === "true";
};

/**
 * Parses the raw hash query object (output of `queryToObject(uri.fragment())`)
 * into a fully typed HashParams.
 */
export function parseHashParams(
  hashProperties: Record<string, string>
): HashParams {
  const initFragments: string[] = [];
  const extra: Record<string, string> = {};

  for (const [key, value] of Object.entries(hashProperties)) {
    if (KNOWN_KEYS.has(key)) continue;
    if (value.length > 0) {
      extra[key] = value;
    } else {
      initFragments.push(key);
    }
  }

  const rawViewerMode = hashProperties["map"];
  const viewerMode =
    rawViewerMode !== undefined && isViewerMode(rawViewerMode)
      ? rawViewerMode
      : undefined;

  return {
    clean: isDefined(hashProperties["clean"]) ? true : undefined,
    hideWelcomeMessage: toBoolean(hashProperties["hideWelcomeMessage"]),
    map: viewerMode,
    ignoreErrors: toBoolean(hashProperties["ignoreErrors"]),
    hideWorkbench: toBoolean(hashProperties["hideWorkbench"]),
    hideExplorerPanel: toBoolean(hashProperties["hideExplorerPanel"]),
    configUrl: hashProperties["configUrl"],
    start: hashProperties["start"],
    share: hashProperties["share"],
    tools: toBoolean(hashProperties["tools"]),
    initFragments,
    extra
  };
}

export const emptyHashParams: HashParams = {
  clean: undefined,
  hideWelcomeMessage: undefined,
  map: undefined,
  ignoreErrors: undefined,
  hideWorkbench: undefined,
  hideExplorerPanel: undefined,
  configUrl: undefined,
  start: undefined,
  share: undefined,
  tools: undefined,
  initFragments: [],
  extra: {}
};
