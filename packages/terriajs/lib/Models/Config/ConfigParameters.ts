import type * as z from "zod";
import type { ConfigParametersSchema } from "./ConfigParametersSchema";

/**
 * The base configuration shape, derived directly from the Zod schema. The
 * schema is the single source of truth for these fields.
 */
export type ConfigParametersBase = z.output<typeof ConfigParametersSchema>;

/**
 * Augmentation seam for downstream applications.
 *
 * A TerriaMap-derived app that extends the runtime schema with
 * `ConfigParametersSchema.extend({...})` widens the resolved config *type* by
 * merging the same fields into this interface — no generic argument has to be
 * threaded through `Terria`, `TerriaConfig` or `ViewState`:
 *
 * @example
 * const AppExtensionSchema = z.object({ myFlag: z.boolean() });
 *
 * declare module "terriajs/lib/Models/Config/ConfigParameters" {
 *   interface ConfigParametersExtensions
 *     extends z.infer<typeof AppExtensionSchema> {}
 * }
 *
 * This module exports **types only**. Import it with `import type` so it is
 * fully erased at compile time and never needs a bundler alias.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConfigParametersExtensions {}

/**
 * The resolved configuration type: the schema-derived base plus any fields
 * merged into {@link ConfigParametersExtensions} by a downstream app.
 */
export type ConfigParameters = ConfigParametersBase &
  ConfigParametersExtensions;
