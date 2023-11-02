export default abstract class PointSizeMap {
  abstract mapValueToPointSize(
    value: string | number | null | undefined
  ): number;
}
