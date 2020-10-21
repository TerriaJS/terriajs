export default interface LatLonHeight {
  latitude: number;
  longitude: number;
  height?: number;
}

export function isLatLonHeight(obj: any): obj is LatLonHeight {
  if (obj) {
    return (
      Number.isFinite(obj.latitude) &&
      Number.isFinite(obj.longitude) &&
      (Number.isFinite(obj.height) || obj.height === undefined)
    );
  } else return false;
}
