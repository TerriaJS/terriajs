import PointSizeMap from "./PointSizeMap";

export default class ScalePointSizeMap extends PointSizeMap {
  constructor(
    readonly minimum: number,
    readonly maximum: number,
    readonly nullSize: number,
    readonly sizeFactor: number,
    readonly sizeOffset: number
  ) {
    super();
  }

  mapValueToPointSize(value: number | null | undefined): number {
    if (value === undefined || value === null) {
      return this.nullSize;
    } else if (this.maximum === this.minimum) {
      return this.sizeOffset;
    } else {
      const normalizedValue =
        (value - this.minimum) / (this.maximum - this.minimum);
      return normalizedValue * this.sizeFactor + this.sizeOffset;
    }
  }
}
