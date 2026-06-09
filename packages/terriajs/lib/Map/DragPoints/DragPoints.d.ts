import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Terria from "../../Models/Terria";

declare class DragPoints {
  constructor(
    terria: Terria,
    pointMovedCallback: (draggableObjects: CustomDataSource) => void
  );

  setUp(): void;
  updateDraggableObjects(draggableObjects: CustomDataSource): void;
  getDragCount(): number;
  resetDragCount(): void;
  destroy(): void;
}

export default DragPoints;
