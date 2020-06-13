export type supportedLineStyle =
  | "esriSLSSolid" // solid line
  | "esriSLSDash" // dashes (-----)
  | "esriSLSDashDot" // line (-.-.-)
  | "esriSLSDashDotDot" // line (-..-..-)
  | "esriSLSDot" // dotted line (.....)
  | "esriSLSLongDash"
  | "esriSLSLongDashDot"
  | "esriSLSShortDash"
  | "esriSLSShortDashDot"
  | "esriSLSShortDashDotDot"
  | "esriSLSShortDot"
  | "esriSLSNull"; // line is not visible

export const esriLineStyleCesium: {
  [key in supportedLineStyle]: number | undefined;
} = {
  esriSLSDot: 7, //"   -"
  esriSLSDashDot: 2017, //"   ----   -"
  esriSLSDashDotDot: 16273, // '  --------   -   - '
  esriSLSLongDash: 2047, // '   --------'
  esriSLSLongDashDot: 4081, // '   --------   -'
  esriSLSShortDash: 4095, //' ----'
  esriSLSShortDot: 13107, //' ---- -'
  esriSLSShortDashDot: 8179, //' ---- - -'
  esriSLSShortDashDotDot: 16281, //' - - - -'
  esriSLSSolid: undefined,
  esriSLSDash: undefined,
  esriSLSNull: undefined
};

export const esriLineStyleLealet: {
  [key: number]: number[];
} = {
  2: [4, 3],
  7: [1, 3],
  2017: [4, 3, 1, 3],
  16273: [8, 3, 1, 3, 1, 3],
  2047: [8, 3],
  4081: [8, 3, 1, 3],
  4095: [4, 1],
  13107: [1, 1],
  8179: [4, 1, 1, 1],
  16281: [4, 1, 1, 1, 1, 1]
};
