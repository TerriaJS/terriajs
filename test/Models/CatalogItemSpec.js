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

    describe('showTimeline', function() {
        beforeEach(function() {
           expect(terria.showTimeline).toBe(0);
        });

        describe('when item has clock', function() {
            beforeEach(function() {
               item.clock = {
                   getValue: jasmine.createSpy('getValue')
               };
            });

            it('should be incremented when layer is enabled', function(done) {
                item.isEnabled = true;

                item._loadForEnablePromise.then(function() {
                   expect(terria.showTimeline).toBe(1);
                   done();
                });
            });

            it('should be decremented when layer is disabled', function(done) {
                item.isEnabled = true;
                item.isEnabled = false;

                item._loadForEnablePromise.then(function() {
                    expect(terria.showTimeline).toBe(0);
                    done();
                });
            });

        });

        describe('when item has no clock', function() {
           it('should remain 0 when layer is enabled', function(done) {
               item.isEnabled = true;

               item._loadForEnablePromise.then(function() {
                   expect(terria.showTimeline).toBe(0);
                   done();
               });
           });
        });
    });
});
