import PointSizeMap from "./PointSizeMap";

export default class ConstantPointSizeMap extends PointSizeMap {
  constructor(readonly pointSize: number) {
    super();
  }

  mapValueToPointSize(_value: string | number | null | undefined): number {
    return this.pointSize;
  }
}
