'use strict';

/*global require,describe,it,expect*/
var CustomMatchers = require('../Utility/CustomMatchers');
var LegendHelper = require('../../lib/Models/LegendHelper');
var TableColumn = require('../../lib/Map/TableColumn');
var TableStyle = require('../../lib/Models/TableStyle');

describe('LegendHelper', function() {

    var tableColumn;

    beforeEach(function() {
        tableColumn = new TableColumn('foo', [9, 5, 1]);
    });

    it('can be instantiated with nothing', function() {
        var legendHelper = new LegendHelper();
        expect(legendHelper).toBeDefined();
        expect(legendHelper.legendUrl()).not.toBeDefined();
    });

    it('colors different values differently by default', function() {
        var legendHelper = new LegendHelper(tableColumn);
        expect(legendHelper).toBeDefined();
        expect(legendHelper.legendUrl()).toBeDefined();  // This is called for its side-effects. Hmmm.
        expect(legendHelper.getColorArrayFromValue(9)).not.toEqual(legendHelper.getColorArrayFromValue(5));
        expect(legendHelper.getColorArrayFromValue(1)).not.toEqual(legendHelper.getColorArrayFromValue(5));
        var legend = legendHelper._legend;
        expect(legend.items.length).toEqual(3);
        expect(+legend.items[0].titleAbove).toEqual(1);
        expect(getColorArrayFromCssColorString(legend.items[0].color)).toEqual(legendHelper.getColorArrayFromValue(1));
        expect(getColorArrayFromCssColorString(legend.items[1].color)).toEqual(legendHelper.getColorArrayFromValue(5));
        expect(getColorArrayFromCssColorString(legend.items[2].color)).toEqual(legendHelper.getColorArrayFromValue(9));
    });

    it('can be forced to color different values the same', function() {
        var tableStyle = new TableStyle({colorMap: 'red-red'});
        var legendHelper = new LegendHelper(tableColumn, tableStyle);
        expect(legendHelper).toBeDefined();
        expect(legendHelper.legendUrl()).toBeDefined();  // Side-effects. Hmmm.
        expect(legendHelper.getColorArrayFromValue(9)).toEqual(legendHelper.getColorArrayFromValue(5));
        expect(legendHelper.getColorArrayFromValue(1)).toEqual(legendHelper.getColorArrayFromValue(5));
        var legend = legendHelper._legend;
        expect(legend.items.length).toEqual(3);
        expect(+legend.items[0].titleAbove).toEqual(1);
        expect(getColorArrayFromCssColorString(legend.items[0].color)).toEqual(legendHelper.getColorArrayFromValue(1));
        expect(getColorArrayFromCssColorString(legend.items[1].color)).toEqual(legendHelper.getColorArrayFromValue(5));
        expect(getColorArrayFromCssColorString(legend.items[2].color)).toEqual(legendHelper.getColorArrayFromValue(9));
    });

    it('colors points via a color gradient when colorBins is 0', function() {
        // This tests the implementation of the color gradient code, which may not be desirable.
        jasmine.addMatchers(CustomMatchers);
        var tableStyle = new TableStyle({
            colorMap: '#000000-#0000FF',
            colorBins: 0
        });
        var legendHelper = new LegendHelper(tableColumn, tableStyle);
        expect(legendHelper).toBeDefined();
        expect(legendHelper.legendUrl()).toBeDefined();  // Side-effects. Hmmm.
        expect(legendHelper.getColorArrayFromValue(9)).toEqual([0, 0, 255, 255]);
        expect(legendHelper.getColorArrayFromValue(5)[2]).toEqualEpsilon(127, 2);
        expect(legendHelper.getColorArrayFromValue(1)).toEqual([0, 0, 0, 255]);
        var legend = legendHelper._legend;
        var numItems = legend.items.length;
        expect(+legend.items[0].titleBelow).toEqual(1);
        expect(+legend.items[numItems - 1].titleAbove).toEqual(9);
        expect(getColorArrayFromCssColorString(legend.gradientColorMap[0].color)).toEqual(legendHelper.getColorArrayFromValue(1));
        expect(getColorArrayFromCssColorString(legend.gradientColorMap[1].color)).toEqual(legendHelper.getColorArrayFromValue(9));
    });

});

// This is copied from LegendHelper, without the alpha override parameter.
// It also converts the result from a Uint8ClampedArray to an Array (requires a polyfill in IE).
function getColorArrayFromCssColorString(cssString) {
    var canvas = document.createElement("canvas");
    if (!canvas) {
        return undefined; // Failed
    }
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = cssString;
    ctx.fillRect(0, 0, 2, 2);
    var uints = ctx.getImageData(0, 0, 1, 1).data;
    return [uints[0], uints[1], uints[2], uints[3]];
}
