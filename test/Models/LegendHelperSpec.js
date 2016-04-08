'use strict';

/*global require,describe,it,expect*/
var LegendHelper = require('../../lib/Models/LegendHelper');
var TableColumn = require('../../lib/Map/TableColumn');
var TableStyle = require('../../lib/Models/TableStyle');

describe('LegendHelper', function() {

    it('can be instantiated with nothing', function() {
        var legendHelper = new LegendHelper();
        expect(legendHelper).toBeDefined();
        expect(legendHelper.legendUrl()).not.toBeDefined();
    });

    // These tests only test point coloring, not the way it appears in the legend.
    describe('point coloring', function() {

        var tableColumn;

        beforeEach(function() {
            tableColumn = new TableColumn('foo', [9, 5, 1]);
        });

        it('colors different values differently by default', function() {
            var legendHelper = new LegendHelper(tableColumn);
            expect(legendHelper).toBeDefined();
            expect(legendHelper.legendUrl()).toBeDefined();  // This is called for its side-effects. Hmmm.
            expect(legendHelper.getColorArrayFromValue(9)).not.toEqual(legendHelper.getColorArrayFromValue(5));
            expect(legendHelper.getColorArrayFromValue(1)).not.toEqual(legendHelper.getColorArrayFromValue(5));
        });

        it('can be forced to color different values the same', function() {
            var tableStyle = new TableStyle({colorMap: 'red-red'});
            var legendHelper = new LegendHelper(tableColumn, tableStyle);
            expect(legendHelper).toBeDefined();
            expect(legendHelper.legendUrl()).toBeDefined();  // Side-effects. Hmmm.
            expect(legendHelper.getColorArrayFromValue(9)).toEqual(legendHelper.getColorArrayFromValue(5));
            expect(legendHelper.getColorArrayFromValue(1)).toEqual(legendHelper.getColorArrayFromValue(5));
        });

        it('colors points via a color gradient when colorBins is 0', function() {
            var tableStyle = new TableStyle({
                colorMap: '#000-#00F',
                colorBins: 0
            });
            var legendHelper = new LegendHelper(tableColumn, tableStyle);
            expect(legendHelper).toBeDefined();
            expect(legendHelper.legendUrl()).toBeDefined();  // Side-effects. Hmmm.
            expect(legendHelper.getColorArrayFromValue(9)).toEqual([0, 0, 255, 255]);
            expect(legendHelper.getColorArrayFromValue(5)).toEqual([0, 0, 128, 255]);
            expect(legendHelper.getColorArrayFromValue(1)).toEqual([0, 0, 0, 255]);
        });

    });

});