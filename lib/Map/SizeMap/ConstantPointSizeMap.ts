import PointSizeMap from "./PointSizeMap";

export default class ConstantPointSizeMap extends PointSizeMap {
  constructor(readonly pointSize: number) {
    super();
  }

  mapValueToPointSize(): number {
    return this.pointSize;
  }
}
