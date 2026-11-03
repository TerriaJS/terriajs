import * as z from "zod";

export const ConfigFileSchema = z.looseObject({
  parameters: z.looseObject({}).default({}),
  initializationUrls: z.array(z.string()).optional(),
  v7initializationUrls: z.array(z.string()).optional()
});

export interface LoadConfigResponse {
  config: z.infer<typeof ConfigFileSchema>;
  baseUri: URI;
}
