import { ConfigParametersSchema } from "terriajs/lib/Models/Config/ConfigParametersSchema";
import * as z from "zod";

export const TerriaMapConfigOptions = ConfigParametersSchema.extend({
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

export type SassConfigParams = z.infer<typeof TerriaMapConfigOptions>;
