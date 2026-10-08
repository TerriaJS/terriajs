import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import Terria from "../../Models/Terria";

interface Options {
  pointMovedCallback?: (draggableObjects: CustomDataSource) => void;
  pointMovingCallback?: (entity: Entity) => void;
  mapPickedObjectCallback?: (entity: Entity | undefined) => Entity | undefined;

  // Allow dragging points on other objects in 3d mode. Defaults to false.
  dragOnObjects?: boolean;
}

declare class DragPoints {
  constructor(
    terria: Terria,
    pointMovedCallbackOrOptions?:
      | ((draggableObjects: CustomDataSource) => void)
      | Options
  );

  setUp(): void;
  updateDraggableObjects(draggableObjects: CustomDataSource): void;
  getDragCount(): number;
  resetDragCount(): void;
  destroy(): void;
}

export default DragPoints;
