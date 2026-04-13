import TerriaError from "../../Core/TerriaError";
import { TerriaConfig } from "../TerriaConfig";
export interface ErrorServiceOptions {
  provider?: string;
  configuration: any;
}

/**
 * The interface that all valid error service providers must implement.
 */
export interface ErrorServiceProvider {
  init: (config: TerriaConfig) => void;
  error: (error: string | Error | TerriaError) => void;
}
