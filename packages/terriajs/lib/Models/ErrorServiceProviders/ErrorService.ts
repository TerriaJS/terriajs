import TerriaError from "../../Core/TerriaError";
import { ConfigParameters } from "../Config/TerriaConfig";
export interface ErrorServiceOptions {
  provider?: string;
  configuration: any;
}

/**
 * The interface that all valid error service providers must implement.
 */
export interface ErrorServiceProvider {
  init: (config: ConfigParameters) => void;
  error: (error: string | Error | TerriaError) => void;
}
