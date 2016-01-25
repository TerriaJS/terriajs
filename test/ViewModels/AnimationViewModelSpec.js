'use strict';

/*global require*/
var AnimationViewModel = require('../../lib/ViewModels/AnimationViewModel');
var Terria = require('../../lib/Models/Terria');
var CatalogItem = require('../../lib/Models/CatalogItem');

describe('AnimationViewModel', function() {
    var terria;
    var animationVm;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        animationVm = new AnimationViewModel({
            terria: terria
        });
        animationVm.timeline = {
            zoomTo: jasmine.createSpy('zoomTo')
        };
    });

    it('on init, showAnimation should be false', function() {
       expect(animationVm.showAnimation).toBe(false);
    });

    describe('when a layer is added to the time series stack', function() {
        var LAYER_NAME = 'blahface';

        beforeEach(function() {
            var catalogItem = buildCatalogItem();
            catalogItem.name = LAYER_NAME;

            terria.timeSeriesStack.addLayerToTop(catalogItem);
        });

        it('should set showAnimation to true', function() {
            expect(animationVm.showAnimation).toBe(true);
        });

        it('should set layerName to the name of the topmost layer', function() {
            expect(animationVm.layerName).toBe(LAYER_NAME);
        });
    });

    describe('when the last layer is removed from the time series stack', function() {
        beforeEach(function() {
            var catalogItem = buildCatalogItem();

            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.timeSeriesStack.removeLayer(catalogItem);
        });

        it('should set showAnimation to false', function() {
            expect(animationVm.showAnimation).toBe(false);
        });
    });

    function buildCatalogItem() {
        var catalogItem = new CatalogItem(terria);
        catalogItem.clock = {
            getValue: jasmine.createSpy('getValue')
        };
        return catalogItem;
    }
});
