import { ConfigParametersSchema } from "terriajs/lib/Models/Config/ConfigParametersSchema";
import * as z from "zod";

/**
 * Fields TerriaMap adds on top of the base TerriaJS config. Defined once, then
 * used both to extend the runtime schema (below) and to widen the resolved
 * config type via declaration merging — a single source of truth.
 */
const TerriaMapExtensionSchema = z.object({
  globalDisclaimer: z
    .object({
      enableOnLocalhost: z.boolean(),
      devHostRegex: z.string().optional(),
      prodHostRegex: z.string().optional(),
      title: z.string().optional(),
      buttonTitle: z.string().optional(),
      denyText: z.string().optional(),
      afterDenyLocation: z.string().optional()
    })
    .optional()
});

declare module "terriajs/lib/Models/Config/ConfigParameters" {
  interface ConfigParametersExtensions extends z.infer<
    typeof TerriaMapExtensionSchema
  > {}
}

export const TerriaMapConfigOptions = ConfigParametersSchema.extend(
  TerriaMapExtensionSchema.shape
);

export type TerriaMapConfigParams = z.infer<typeof TerriaMapConfigOptions>;
