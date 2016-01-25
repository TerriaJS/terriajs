'use strict';

/*global require*/
var CatalogItem = require('../../lib/Models/CatalogItem');
var Terria = require('../../lib/Models/Terria');

describe('CatalogItem', function() {
    var terria;
    var item;
    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        item = new CatalogItem(terria);
    });

    it('uses the url as the direct dataUrl', function() {
        item.url = 'http://foo.bar';

        expect(item.dataUrlType).toBe('direct');
        expect(item.dataUrl).toBe('http://foo.bar');

        item.url = 'http://something.else';
        expect(item.dataUrlType).toBe('direct');
        expect(item.dataUrl).toBe('http://something.else');
    });

    it('explicit dataUrl and dataUrlType overrides using url', function() {
        item.url = 'http://foo.bar';
        item.dataUrl = 'http://something.else';
        item.dataUrlType = 'wfs';

        expect(item.dataUrl).toBe('http://something.else');
        expect(item.dataUrlType).toBe('wfs');

        // Make sure setting the url again doesn't override the explicitly-set dataUrl.
        item.url = 'http://hello.there';
        expect(item.dataUrl).toBe('http://something.else');
        expect(item.dataUrlType).toBe('wfs');
    });

    describe('time series data: ', function() {
        beforeEach(function () {
            spyOn(terria.timeSeriesStack, 'addLayerToTop');
            spyOn(terria.timeSeriesStack, 'removeLayer');
        });

        describe('when item has clock', function() {
            beforeEach(function() {
               item.clock = {
                   getValue: jasmine.createSpy('getValue')
               };
            });

            it('item should be added to top of timeSeriesStack when enabled', function(done) {
                item.isEnabled = true;

                item._loadForEnablePromise.then(function() {
                   expect(terria.timeSeriesStack.addLayerToTop).toHaveBeenCalledWith(item);
                   done();
                });
            });

            it('should be removed from timeSeriesStack when disabled', function(done) {
                item.isEnabled = true;

                item._loadForEnablePromise.then(function() {
                    item.isEnabled = false;
                    expect(terria.timeSeriesStack.removeLayer).toHaveBeenCalledWith(item);
                    done();
                });
            });

        });

        describe('when item has no clock', function() {
           it('should not call timeSeriesStack', function(done) {
               item.isEnabled = true;

               item._loadForEnablePromise.then(function() {
                   expect(terria.timeSeriesStack.addLayerToTop).not.toHaveBeenCalled();
                   done();
               });
           });
        });
    });
});
