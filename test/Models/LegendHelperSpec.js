"use strict";

/*global require,describe,it,expect*/
var CustomMatchers = require("../Utility/CustomMatchers");
var LegendHelper = require("../../lib/Models/LegendHelper");
var TableColumn = require("../../lib/Map/TableColumn");
var TableStyle = require("../../lib/Models/TableStyle");

describe("LegendHelper", function() {
  var tableColumn;

  beforeEach(function() {
    tableColumn = new TableColumn("foo", [9, 5, 1]);
  });

  it("can be instantiated with nothing", function() {
    var legendHelper = new LegendHelper();
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).not.toBeDefined();
  });

  it("colors different values differently by default", function() {
    var legendHelper = new LegendHelper(tableColumn);
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).toBeDefined(); // This is called for its side-effects. Hmmm.
    expect(legendHelper.getColorArrayFromValue(9)).not.toEqual(
      legendHelper.getColorArrayFromValue(5)
    );
    expect(legendHelper.getColorArrayFromValue(1)).not.toEqual(
      legendHelper.getColorArrayFromValue(5)
    );
    var legend = legendHelper._legend;
    expect(legend.items.length).toEqual(3);
    expect(+legend.items[0].titleAbove).toEqual(1);
    expect(getColorArrayFromCssColorString(legend.items[0].color)).toEqual(
      legendHelper.getColorArrayFromValue(1)
    );
    expect(getColorArrayFromCssColorString(legend.items[1].color)).toEqual(
      legendHelper.getColorArrayFromValue(5)
    );
    expect(getColorArrayFromCssColorString(legend.items[2].color)).toEqual(
      legendHelper.getColorArrayFromValue(9)
    );
  });

  it("can be forced to color different values the same", function() {
    var tableStyle = new TableStyle({ colorMap: "red-red" });
    var legendHelper = new LegendHelper(tableColumn, tableStyle);
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).toBeDefined(); // Do this for its side-effects. Hmmm.
    expect(legendHelper.getColorArrayFromValue(9)).toEqual(
      legendHelper.getColorArrayFromValue(5)
    );
    expect(legendHelper.getColorArrayFromValue(1)).toEqual(
      legendHelper.getColorArrayFromValue(5)
    );
    var legend = legendHelper._legend;
    expect(legend.items.length).toEqual(3);
    expect(+legend.items[0].titleAbove).toEqual(1);
    expect(getColorArrayFromCssColorString(legend.items[0].color)).toEqual(
      legendHelper.getColorArrayFromValue(1)
    );
    expect(getColorArrayFromCssColorString(legend.items[1].color)).toEqual(
      legendHelper.getColorArrayFromValue(5)
    );
    expect(getColorArrayFromCssColorString(legend.items[2].color)).toEqual(
      legendHelper.getColorArrayFromValue(9)
    );
  });

  it("handles integer number of colorBins", function() {
    var tableStyle = new TableStyle({ colorBins: 3 });
    var legendHelper = new LegendHelper(tableColumn, tableStyle);
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).toBeDefined(); // Do this for its side-effects. Hmmm.
    expect(legendHelper._binColors.length).toEqual(3);
  });

  it("handles array of colorBins covering full range", function() {
    var tableStyle = new TableStyle({ colorBins: [0, 2, 6, 10] });
    var legendHelper = new LegendHelper(tableColumn, tableStyle);
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).toBeDefined(); // Do this for its side-effects. Hmmm.
    expect(legendHelper._binColors.length).toEqual(3); // Ranges are 1-2, 2-6, 6-9.
  });

  it("extends array of colorBins to cover full range", function() {
    var tableStyle = new TableStyle({ colorBins: [2, 4, 7] });
    var legendHelper = new LegendHelper(tableColumn, tableStyle);
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).toBeDefined(); // Do this for its side-effects. Hmmm.
    expect(legendHelper._binColors.length).toEqual(4); // Ranges are 1-2, 2-4, 4-7, 7-9.
  });

  it("filters array of colorBins if outside range", function() {
    var tableStyle = new TableStyle({
      colorBins: [-30, -10, 0, 2, 4, 7, 10, 14, 16]
    });
    var legendHelper = new LegendHelper(tableColumn, tableStyle);
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).toBeDefined(); // Do this for its side-effects. Hmmm.
    expect(legendHelper._binColors.length).toEqual(4); // Ranges are 1-2, 2-4, 4-7, 7-9.
  });

  it("retains colorMap when filtering array of colorBins", function() {
    // Ensure both TableColumns assign the same colour to equal values
    var tableStyle = new TableStyle({
      colorBins: [-30, -10, 0, 2, 4, 7, 10, 14, 16],
      colorMap: "white-red-orange-yellow-green-blue-indigo-violet-grey-black"
    });
    var legendHelper1 = new LegendHelper(tableColumn, tableStyle);
    var tableColumn2 = new TableColumn("foo", [15, 9, 5, 1, -25]);
    var legendHelper2 = new LegendHelper(tableColumn2, tableStyle);
    expect(legendHelper1).toBeDefined();
    expect(legendHelper1.legendUrl()).toBeDefined(); // Do this for its side-effects. Hmmm.
    expect(legendHelper2.legendUrl()).toBeDefined(); // Do this for its side-effects. Hmmm.
    [1, 5, 9].forEach(function(val) {
      expect(legendHelper1.getColorArrayFromValue(val)).toEqual(
        legendHelper2.getColorArrayFromValue(val)
      );
    });
  });

  it("handles array of colorBins for enum values", function() {
    var enumTableColumn = new TableColumn("foo", ["A", "B", "A"]);
    var tableStyle = new TableStyle({
      colorBins: [{ value: "A", color: "red" }, { value: "B", color: "blue" }]
    });
    var legendHelper = new LegendHelper(enumTableColumn, tableStyle);
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).toBeDefined(); // Do this for its side-effects. Hmmm.
    expect(Object.keys(legendHelper._binColors).length).toEqual(2); // For values 'A' and 'B'
  });

  it("filters array of colorBins if enum values are not present", function() {
    var enumTableColumn = new TableColumn("foo", ["A", "A"]);
    var tableStyle = new TableStyle({
      colorBins: [{ value: "A", color: "red" }, { value: "B", color: "blue" }]
    });
    var legendHelper = new LegendHelper(enumTableColumn, tableStyle);
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).toBeDefined(); // Do this for its side-effects. Hmmm.
    expect(Object.keys(legendHelper._binColors).length).toEqual(1); // For value 'A' only
  });

  it("colors points via a color gradient when colorBins is 0", function() {
    // This tests the implementation of the color gradient code, which may not be desirable.
    jasmine.addMatchers(CustomMatchers);
    var tableStyle = new TableStyle({
      colorMap: "#000000-#0000FF",
      colorBins: 0
    });
    var legendHelper = new LegendHelper(tableColumn, tableStyle);
    expect(legendHelper).toBeDefined();
    expect(legendHelper.legendUrl()).toBeDefined(); // Side-effects. Hmmm.
    expect(legendHelper.getColorArrayFromValue(9)).toEqual([0, 0, 255, 255]);
    expect(legendHelper.getColorArrayFromValue(5)[2]).toEqualEpsilon(127, 2);

    expect(
      compareColors(legendHelper.getColorArrayFromValue(1), [0, 0, 0, 255])
    ).toBe(true);

    var legend = legendHelper._legend;
    var numItems = legend.items.length;
    expect(+legend.items[0].titleBelow).toEqual(1);
    expect(+legend.items[numItems - 1].titleAbove).toEqual(9);
    expect(
      compareColors(
        getColorArrayFromCssColorString(legend.gradientColorMap[0].color),
        legendHelper.getColorArrayFromValue(1)
      )
    ).toBe(true);
    expect(
      compareColors(
        getColorArrayFromCssColorString(legend.gradientColorMap[1].color),
        legendHelper.getColorArrayFromValue(9)
      )
    ).toBe(true);
  });

  function compareColors(a, b) {
    return (
      Math.abs(a[0] - b[0]) <= 1 &&
      Math.abs(a[1] - b[1]) <= 1 &&
      Math.abs(a[2] - b[2]) <= 1 &&
      Math.abs(a[3] - b[3]) <= 1
    );
  }
});

// This is copied from LegendHelper, without the alpha override parameter.
// It also converts the result from a Uint8ClampedArray to an Array (requires a polyfill in IE).
function getColorArrayFromCssColorString(cssString) {
  var canvas = document.createElement("canvas");
  if (!canvas) {
    return undefined; // Failed
  }
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = cssString;
  ctx.fillRect(0, 0, 2, 2);
  var uints = ctx.getImageData(0, 0, 1, 1).data;
  return [uints[0], uints[1], uints[2], uints[3]];
}
