export interface PrettifyOptions {
  /**
   * The height.
   */
  height?: number;

  /**
   * The error +/- for the height.
   */
  errorBar?: number;

  /**
   * The number of digits to fix the lat / lon to.
   */
  digits?: number;
}

export interface PrettyCoordinates {
  longitude: string;
  latitude: string;
  elevation: string | undefined;
}

/**
 * Turns the longitude / latitude in degrees into a human readable pretty strings.
 *
 * @param longitude The longitude to format.
 * @param latitude The latitude to format.
 * @param options Options for the prettification.
 */
export default function prettifyCoordinates(
  longitude: number,
  latitude: number,
  { height, errorBar, digits = 5 }: PrettifyOptions = {}
) {
  const prettyLatitude =
    Math.abs(latitude).toFixed(digits) + "°" + (latitude < 0.0 ? "S" : "N");
  const prettyLongitude =
    Math.abs(longitude).toFixed(digits) + "°" + (longitude < 0.0 ? "W" : "E");

  let prettyElevation = undefined;
  if (height !== undefined) {
    prettyElevation =
      Math.round(height) +
      (errorBar !== undefined ? "±" + Math.round(errorBar) : "") +
      "m";
  }

  return {
    longitude: prettyLongitude,
    latitude: prettyLatitude,
    elevation: prettyElevation
  };
}
