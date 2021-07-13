const defaultDashArray = [4, 3];

const esriLineStyleCesium: {
  [key: string]: number;
} = {
  esriSLSDot: 7, //"   -"
  esriSLSDashDot: 2017, //"   ----   -"
  esriSLSDashDotDot: 16273, // '  --------   -   - '
  esriSLSLongDash: 2047, // '   --------'
  esriSLSLongDashDot: 4081, // '   --------   -'
  esriSLSShortDash: 4095, //' ----'
  esriSLSShortDot: 13107, //' ---- -'
  esriSLSShortDashDot: 8179, //' ---- - -'
  esriSLSShortDashDotDot: 16281 //' - - - -'
};

const esriLineStyleLealet: {
  [key: number]: number[];
} = {
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

export function getLineStyleLeaflet(dashPattern: number): number[] {
  if (esriLineStyleLealet[dashPattern]) {
    return esriLineStyleLealet[dashPattern];
  }
  return defaultDashArray;
}

export function getLineStyleCesium(styleName: string) {
  if (esriLineStyleCesium[styleName]) {
    return esriLineStyleCesium[styleName];
  }
  return undefined;
}
