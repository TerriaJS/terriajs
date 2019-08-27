import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";

export default interface VehicleData {
  /**
   * Where to put the vehicle.
   */
  position?: Cartesian3;

  /**
   * Image to draw to represent the vehicle
   */
  billboard?: BillboardGraphics;

  /**
   * Point to draw to represent the vehicle
   */
  point?: PointGraphics;

  /**
   * Unique identifier of this data in its source system.
   */
  sourceId?: string;

  /**
   * Transformation of the vehicle 3D model.
   */
  orientation?: Quaternion;

  /**
   * Key-value pairs to populate the feature info template with.
   */
  featureInfo?: Map<string, any>;
}
