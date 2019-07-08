import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";

export default interface VehicleData {
  /**
   * Where to put the billboard.
   */
  position?: Cartesian3;

  billboardGraphics?: BillboardGraphics;

  /**
   * Unique identifier of this data in its source system.
   */
  sourceId?: string;

  orientation?: Quaternion;

  featureInfo?: Map<string, any>;
}
