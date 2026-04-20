import { z } from "zod";

const hashParamsSchema = z
  .looseObject({
    clean: z
      .codec(z.optional(z.string()), z.optional(z.boolean()), {
        decode: (value) => value !== undefined,
        encode: (value) => (value ? "" : undefined)
      })
      .describe("If present, clears all init sources on load"),
    hideWelcomeMessage: z
      .codec(z.optional(z.string()), z.optional(z.boolean()), {
        decode: (value) => value !== undefined,
        encode: (value) => (value ? "" : undefined)
      })
      .describe("If present, hides the welcome message on load"),
    map: z
      .codec(
        z.optional(z.string()),
        z.optional(z.enum(["2d", "3d", "3dsmooth"])),
        {
          decode: (value) =>
            value === "2d" || value === "3d" || value === "3dsmooth"
              ? value
              : undefined,
          encode: (value) => value
        }
      )
      .describe("Viewer mode to use on load"),
    ignoreErrors: z
      .stringbool({
        truthy: ["1", "true", "yes"],
        falsy: ["0", "false", "no"]
      })
      .optional()
      .describe("If present, ignores errors on load"),
    hideWorkbench: z
      .stringbool()
      .optional()
      .describe("If present, hides the workbench on load"),
    hideExplorerPanel: z
      .stringbool()
      .optional()
      .describe("If present, hides the explorer panel on load"),
    configUrl: z.url().optional().describe("Config URL to use on load"),
    start: z
      .codec(z.string(), z.json(), {
        decode: (value) => {
          try {
            return JSON.parse(value);
          } catch {
            return undefined;
          }
        },
        encode: (value) => JSON.stringify(value)
      })
      .optional()
      .describe("Raw JSON string to use on start"),
    share: z.string().optional().describe("Share key to use on load"),
    tools: z
      .stringbool()
      .optional()
      .describe("If present, activates additional tools menu")
  })
  .transform((input) => {
    const {
      clean,
      hideWelcomeMessage,
      map,
      ignoreErrors,
      hideWorkbench,
      hideExplorerPanel,
      configUrl,
      start,
      share,
      tools,
      ...rest
    } = input;

    const initFragments: string[] = [];
    const extra: Record<string, string> = {};
    for (const [key, value] of Object.entries(rest as Record<string, string>)) {
      if (value.length === 0) {
        initFragments.push(key);
      } else {
        extra[key] = value;
      }
    }

    return {
      clean,
      hideWelcomeMessage,
      map,
      ignoreErrors,
      hideWorkbench,
      hideExplorerPanel,
      configUrl,
      start,
      share,
      tools,
      initFragments,
      extra
    };
  });

/**
 * All URL hash parameters parsed into a single typed object.
 *
 * Named special params are lifted into explicit fields; everything else falls
 * into `initFragments` (empty-value keys → init source file names) or
 * `extra` (unknown keys with values — forwarded in share links).
 */

export type HashParams = z.infer<typeof hashParamsSchema>;

/**
 * Parses the raw hash query object (output of `queryToObject(uri.fragment())`)
 * into a fully typed HashParams.
 */
export function parseHashParams(
  hashProperties: Record<string, string>
): HashParams {
  return hashParamsSchema.parse(hashProperties);
}

export const emptyHashParams: HashParams = hashParamsSchema.parse({});
