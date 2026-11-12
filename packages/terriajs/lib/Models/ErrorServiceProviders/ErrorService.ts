import TerriaError from "../../Core/TerriaError";
import { ConfigParameters } from "../Config/TerriaConfig";
export interface ErrorServiceOptions {
  provider?: string;
  configuration: any;
}

/** Where the user saw the error, or `none` if it wasn't shown. */
export type ErrorDisplay = "modal" | "toast" | "workbench" | "catalog" | "none";

/**
 * The interface that all valid error service providers must implement.
 */
export interface ErrorServiceProvider {
  init: (config: ConfigParameters) => void;
  error: (error: string | Error | TerriaError, display?: ErrorDisplay) => void;
}
