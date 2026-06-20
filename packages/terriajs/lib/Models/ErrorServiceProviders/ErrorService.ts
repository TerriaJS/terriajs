import TerriaError from "../../Core/TerriaError";
import { TerriaConfig } from "../Config/TerriaConfig";
export interface ErrorServiceOptions {
  provider?: string;
  configuration: any;
}

/**
 * The interface that all valid error service providers must implement.
 */
export interface ErrorServiceProvider<
  TConfig extends TerriaConfig = TerriaConfig
> {
  init: (config: TConfig) => void;
  error: (error: string | Error | TerriaError) => void;
}
