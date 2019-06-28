import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";

export default interface BillboardData {
  /**
   * Where to put the billboard
   */
  position?: Cartesian3;

  billboardGraphicsOptions?: any;
}
