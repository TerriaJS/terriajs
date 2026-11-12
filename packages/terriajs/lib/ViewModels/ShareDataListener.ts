import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import { InitSourceData } from "../Models/InitSource";
import Terria from "../Models/Terria";
import ViewState from "../ReactViewModels/ViewState";

/**
 * Parameters passed to the share-data callback.
 */
interface Parameters {
  /**
   * The init source being built. Listeners add their own keys to it to
   * include their data in the share link or story scene.
   */
  initSource: InitSourceData;

  /**
   * False when a story will auto-start, so the current view (e.g. camera
   * position) should not be captured.
   */
  includeCurrentView: boolean;

  terria: Terria;
  viewState?: ViewState;
}

type ShareDataListener = (params: Parameters) => void;

/**
 * Shared instance for managing share-data events
 */
const shareDataEvent = new CesiumEvent();

/**
 * Add a new listener that is called whenever share data is built, for a
 * share link or a story scene capture
 *
 * @returns A destroyer function to remove the listener
 */
export function addShareDataListener(callback: ShareDataListener): () => void {
  const destroyer = shareDataEvent.addEventListener(callback);
  return destroyer;
}

/**
 * @private
 * Raises a share-data event
 */
export function raiseShareDataEvent(parameters: Parameters) {
  shareDataEvent.raiseEvent(parameters);
}
