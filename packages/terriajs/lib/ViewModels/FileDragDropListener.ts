import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import MappableMixin from "../ModelMixins/MappableMixin";

/**
 * Parameters passed to the drag-n-drop callback.
 */
interface Parameters {
  /**
   * New items added to the workbench from the dragged file
   */
  addedItems: MappableMixin.Instance[];

  /**
   * The coordinates of the point on the page where the drag happened
   *
   * Useful for any UI feature that has to show some indication of the dragged position.
   */
  mouseCoordinates: { clientX: number; clientY: number };
}

type DropListener = (params: Parameters) => void;

/**
 * Shared instance for managing drag-n-drop file events
 */
const dragDropEvent = new CesiumEvent();

/**
 * Add a new listener for file drag-n-drop events
 *
 * @returns A destroyer function to remove the listener
 */
export function addFileDragDropListener(callback: DropListener): () => void {
  const destroyer = dragDropEvent.addEventListener(callback);
  return destroyer;
}

/**
 * @private
 * Raises a file drag-n-drop event
 */
export function raiseFileDragDropEvent(parameters: Parameters) {
  dragDropEvent.raiseEvent(parameters);
}
