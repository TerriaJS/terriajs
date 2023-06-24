import TerriaError from "../../Core/TerriaError";
import { ErrorServiceProvider } from "./ErrorService";

/**
 * A stub error service provider that does nothing.
 */
export default class StubErrorServiceProvider implements ErrorServiceProvider {
  error(_error: string | Error | TerriaError) {}
}
