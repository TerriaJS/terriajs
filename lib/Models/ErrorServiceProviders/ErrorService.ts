import TerriaError from "../../Core/TerriaError";

export interface ErrorServiceOptions {
  provider: string;
  configuration: any;
}

/**
 * The interface that all valid error service providers must implement.
 */
export type ErrorServiceProvider = {
  error(error: string | Error | TerriaError): void;
};

/**
 * Asynchronously loads and returns an error service provider instance for the given options.
 */
export async function initializeErrorServiceProvider(
  options?: ErrorServiceOptions
): Promise<ErrorServiceProvider> {
  const provider = options?.provider;
  const configuration = options?.configuration;

  if (provider === "rollbar") {
    const rollbarModule = await import("./RollbarErrorServiceProvider");
    const rollbarProvider = new rollbarModule.default(configuration);
    return rollbarProvider;
  } else {
    throw new Error(`Unknown error service provider: ${provider}`);
  }
}
