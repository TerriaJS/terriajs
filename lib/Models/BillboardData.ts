import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import { BillboardGraphicsOptions } from "terriajs-cesium/Source/DataSources/BillboardGraphics";

export default interface BillboardData {
  /**
   * Where to put the billboard.
   */
  position?: Cartesian3;

  /**
   * The options to pass to the constructor for a BillboardGraphics object.
   */
  billboardGraphicsOptions?: BillboardGraphicsOptions;

  /**
   * Unique identifier of this data in its source system.
   */
  sourceId?: string;

  orientation?: Quaternion;
}
