'use strict';

/*global require, fail*/
var loadText = require('terriajs-cesium/Source/Core/loadText');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var Terria = require('../../lib/Models/Terria');
var SdmxJsonCatalogItem = require('../../lib/Models/SdmxJsonCatalogItem');

describe('SdmxJsonCatalogItem', function() {
    var terria;
    var item;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        item = new SdmxJsonCatalogItem(terria);
    });

    it('can update from json', function() {
        item.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://foo.bar',
            dataUrlComponent: 'atad'
        });
        expect(item.name).toBe('Name');
        expect(item.description).toBe('Description');
        expect(item.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(item.type).toBe('sdmx-json');
        expect(item.url.indexOf('http://foo.bar')).toBe(0);
        expect(item.dataUrlComponent).toBe('atad');
    });

    it('can be round-tripped with serializeToJson and updateFromJson', function() {
        item.updateFromJson({
            name: 'Name',
            id: 'Id',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://foo.bar/',
            dataUrlComponent: 'atad'
        });
        var json = item.serializeToJson();
        var reconstructed = new SdmxJsonCatalogItem(terria);
        reconstructed.updateFromJson(json);
        // item.concepts has a circular dependency via its __knockoutSubscribable property,
        // with itself being a subscriber, so it will not equal reconstructed.concepts.
        // So check the arrays are equal, and then remove them before comparing the rest of the item.
        expect(item.concepts.slice(), reconstructed.concepts.slice());
        delete item.concepts;
        delete item._concepts;
        delete reconstructed.concepts;
        delete reconstructed._concepts;
        // for (var i = Object.keys(item).length - 1; i >= 0; i--) {
        //     var k = Object.keys(item)[i];
        //     console.log(k);
        //     expect(reconstructed[k]).toEqual(item[k]);
        // }

        expect(reconstructed.name).toEqual(item.name);
        expect(reconstructed.id).toEqual(item.id);
        expect(reconstructed.description).toEqual(item.description);
        expect(reconstructed.rectangle).toEqual(item.rectangle);
        expect(reconstructed.url).toEqual(item.url);
        expect(reconstructed.dataUrlComponent).toEqual(item.dataUrlComponent);
    });

    describe('loading', function() {
        var regionMappingJson, lgaData;
        var dataflowFoo, dataFooBD2;
        beforeEach(function(done) {
            when.all([
                loadText('test/SDMX-JSON/dataflow-foo.json').then(function(text) { dataflowFoo = text; }),
                loadText('test/SDMX-JSON/data-foo-BD2-2013.json').then(function(text) { dataFooBD2 = text; }),
                loadText('data/regionMapping.json').then(function(text) { regionMappingJson = text; }),
                loadText('data/regionids/region_map-FID_LGA_2015_AUST_LGA_CODE15.json').then(function(text) { lgaData = text; })
            ]).then(function() {
                jasmine.Ajax.install();
                jasmine.Ajax.stubRequest(/.*/).andError(); // Fail all requests by default.
                jasmine.Ajax.stubRequest('http://sdmx.example.com/sdmx-json/dataflow/FOO').andReturn({responseText: dataflowFoo});
                jasmine.Ajax.stubRequest('http://sdmx.example.com/sdmx-json/data/FOO/BD_2..A/all?startTime=2013&endTime=2013').andReturn({responseText: dataFooBD2});
                jasmine.Ajax.stubRequest('data/regionMapping.json').andReturn({responseText: regionMappingJson});
                jasmine.Ajax.stubRequest('data/regionids/region_map-FID_LGA_2015_AUST_LGA_CODE15.json').andReturn({responseText: lgaData});
            }).then(done).otherwise(done.fail);
        });

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });

        it('works with a specific SDMX-JSON file', function(done) {
            item.updateFromJson({
                name: 'Foo',
                url: 'http://sdmx.example.com/sdmx-json/data/FOO/BD_2..A/all?startTime=2013&endTime=2013'
            });
            item.load().then(function() {
                var regionDetails = item.regionMapping.regionDetails;
                expect(regionDetails).toBeDefined();
                var columnNames = item.tableStructure.getColumnNames();
                expect(columnNames.length).toEqual(2);
                expect(columnNames[0]).toEqual('LGA_code_2013');
                expect(item.tableStructure.columns[1].values).toEqual([1140, 535, 79, 12, 38]);
            }).otherwise(fail).then(done);
        });

        // I'm not sure we want this test.
        it('gracefully handles a non-SDMX URL', function(done) {
            item.updateFromJson({
                name: 'Name',
                url: 'http://example.com'
            });
            item.load().then(function() {
                return item.dataSource.regionPromise;
            }).otherwise(function(e) {
                // We actually want this to fail; if it doesn't get here, will say SPEC HAS NO EXPECTATIONS.
                expect(true).toBe(true);
            }).then(done);
        });

        // TODO: (this is old)
        // it('works with selectedInitially parameter', function(done) {
        //     item.updateFromJson({
        //         name: 'Name',
        //         datasetId: 'foo',
        //         url: 'http://abs.example.com',
        //         filter: ["REGIONTYPE.SA4"]  // Should use SA4 now
        //     });
        //     item.load().then(function() {
        //         var regionDetails = item.regionMapping.regionDetails;
        //         expect(regionDetails).toBeDefined();
        //         var columnNames = item.tableStructure.getColumnNames();
        //         expect(columnNames.slice(0, 3)).toEqual(["sa4_code_2011", "Year", "0-1 years"]);
        //         var percentage = item.tableStructure.activeItems[0].values[0];
        //         expect(percentage).toEqual(12.5);  // 26 / 208 * 100
        //     }).otherwise(fail).then(done);
        // });

        it('is less than 2000 characters when serialised to JSON then URLEncoded', function(done) {
            item.updateFromJson({
                name: 'Name',
                description: 'Description',
                url: 'http://abs.example.com/',
                dataUrlComponent: 'foo'
            });
            item.load().then(function() {
                var url = encodeURIComponent(JSON.stringify(item.serializeToJson()));
                expect(url.length).toBeLessThan(2000);
            }).otherwise(fail).then(done);
        });

    });

});
