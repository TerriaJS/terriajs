const StandardCssColors = {
  // Colors are from Kelly's 1965 paper 'Twenty-two colors of maximum contrast'
  // http://www.iscc.org/pdf/PC54_1724_001.pdf
  // Converted from the NBS/ISCC Color System using http://tx4.us/nbs-iscc.htm
  // - with black removed (it was the second color).
  highContrast: [
    "#F2F3F4", // White 263 White
    "#FFB300", // v.Y 82 Vivid Yellow
    "#803E75", // s.P 218 Strong Purple
    "#FF6800", // v.O 48 Vivid Orange
    "#A6BDD7", // v.l.B 180 Very Light Blue
    "#C10020", // v.R 11 Vivid Red
    "#CEA262", // gy.Y 90 Grayish Yellow
    "#817066", // med.Gy 265 Medium Gray
    "#007D34", // v.G 139 Vivid Green
    "#F6768E", // s.pPk 247 Strong Purplish Pink
    "#00538A", // s.B 178 Strong Blue, bright blue
    "#FF7A5C", // s.yPk 26 Strong Yellowish Pink
    "#53377A", // s.V 207 Strong Violet
    "#FF8E00", // v.OY 66 Vivid Orange Yellow
    "#B32851", // s.pR 255 Strong Purplish Red
    "#F4C800", // v.gY 97 Vivid Greenish Yellow
    "#7F180D", // s.rBr 40 Strong Reddish Brown
    "#93AA00", // v.YG 115 Vivid Yellow Green
    "#593315", // deep yBr 75 Deep Yellowish Brown
    "#F13A13", // v.rO 34 Vivid Reddish Orange
    "#232C16" // d.OlG 126 Dark Olive Green
  ],

  // From ColorBrewer2.org, 9-class Set1 (ie. qualitative).
  brewer9ClassSet1: [
    "#e41a1c",
    "#377eb8",
    "#4daf4a",
    "#984ea3",
    "#ff7f00",
    "#ffff33",
    "#a65628",
    "#f781bf",
    "#999999"
  ],

  // From ColorBrewer2.org, 8-class Set2 (ie. qualitative), with brown replaced with red.
  modifiedBrewer8ClassSet2: [
    "#66c2a5",
    "#fc8d62",
    "#8da0cb",
    "#e78ac3",
    "#a6d854",
    "#ffd92f", // yellow
    // '#e5c494',  // brown, too close to yellow to distinguish easily.
    "#f44a4c", // a lightened red
    "#b3b3b3"
  ]
};

export default StandardCssColors;
