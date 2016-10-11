'use strict';

/*global require, fail*/
var loadText = require('terriajs-cesium/Source/Core/loadText');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var SensorObservationServiceCatalogItem = require('../../lib/Models/SensorObservationServiceCatalogItem');
var Terria = require('../../lib/Models/Terria');
var VarType = require('../../lib/Map/VarType');

describe('SensorObservationServiceCatalogItem', function() {
    var terria;
    var item;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        item = new SensorObservationServiceCatalogItem(terria);
    });

    it('can update from json', function() {
        item.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://foo.bar'
        });
        expect(item.name).toBe('Name');
        expect(item.description).toBe('Description');
        expect(item.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(item.type).toBe('sos');
        expect(item.url.indexOf('http://foo.bar')).toBe(0);
    });

    it('can be round-tripped with serializeToJson and updateFromJson', function() {
        item.updateFromJson({
            name: 'Name',
            id: 'Id',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://foo.bar/',
            initialProcedureIndex: 2
        });
        var json = item.serializeToJson();
        // This json should include initialProcedureIndex.
        expect(json.initialProcedureIndex).toBeDefined();
        var reconstructed = new SensorObservationServiceCatalogItem(terria);
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
        expect(reconstructed.initialProcedureIndex).toEqual(item.initialProcedureIndex);
    });

    describe('loading', function() {
        var getFeatureOfInterestResponse, getObservationResponse;
        beforeEach(function(done) {
            when.all([
                loadText('test/sos/GetFeatureOfInterestResponse.xml').then(function(text) { getFeatureOfInterestResponse = text; }),
                loadText('test/sos/GetObservationResponse.xml').then(function(text) { getObservationResponse = text; })
            ]).then(function() {
                jasmine.Ajax.install();
                jasmine.Ajax.stubRequest(/.*/).andError(); // Fail all requests by default.
                jasmine.Ajax.stubRequest('http://sos.example.com', /.*\<sos:GetFeatureOfInterest.*/)
                    .andReturn({ responseText: getFeatureOfInterestResponse });
                jasmine.Ajax.stubRequest('http://sos.example.com', /.*\<sos:GetObservation.*/)
                    .andReturn({ responseText: getObservationResponse });
            }).then(done).otherwise(done.fail);
        });

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });

        it('works with tryToLoadObservationData false', function(done) {
            item.updateFromJson({
                name: 'Foo',
                url: 'http://sos.example.com',
                procedures: [{identifier: "http://sos.example.com/tstypes/Yearly Mean", title: "Annual average"}],
                observableProperties: [{identifier: "http://sos.example.com/parameters/Storage Level", title: "Storage Level"}],
                tryToLoadObservationData: false
            });
            item.load().then(function() {
                // This is not region mapped.
                expect(item.regionMapping).not.toBeDefined();
                // Expect it to have created the right table of data (with no time dimension).
                var columnNames = item.tableStructure.getColumnNames();
                expect(columnNames).toEqual(['type', 'name', 'id', 'lat', 'lon', 'identifier', 'Annual average']);
                // Test a "slice" of the column's values, to remove knockout stuff.
                expect(item.tableStructure.columns[6].values[0].indexOf('<chart')).toBeGreaterThan(-1);
                // Expect it not to show any concepts to the user.
                expect(item.concepts.length).toEqual(0);
            }).otherwise(fail).then(done);
        });

        it('works with tryToLoadObservationData true', function(done) {
            item.updateFromJson({
                name: 'Foo',
                url: 'http://sos.example.com',
                procedures: [{identifier: "http://sos.example.com/tstypes/Yearly Mean", title: "Annual average"}],
                observableProperties: [{identifier: "http://sos.example.com/parameters/Storage Level", title: "Storage Level"}],
                tryToLoadObservationData: true,
                proceduresName: 'freq',
                observablePropertiesName: 'thing'
            });
            item.load().then(function() {
                // Expect it to have created the right table of data (with no time dimension).
                var columnNames = item.tableStructure.getColumnNames();
                expect(columnNames).toEqual(['date', 'Storage Level Annual average', 'identifier', 'freq', 'thing', 'type', 'name', 'id', 'lat', 'lon']);
                // Test a "slice" of the column's values, to remove knockout stuff.
                var values = item.tableStructure.columns.filter(function(column) {return column.id === 'value';})[0].values;
                var idMapping = item.tableStructure.getIdMapping();
                function valuesForFeatureIdentifier(identifier) {
                    return idMapping[identifier].map(function(rowNumber) {
                        return values[rowNumber];
                    });
                }
                expect(valuesForFeatureIdentifier('http://sos.example.com/stations/1')).toEqual([null, 129.425, null]);
                expect(valuesForFeatureIdentifier('http://sos.example.com/stations/2')).toEqual([null, null, null]);
                expect(valuesForFeatureIdentifier('http://sos.example.com/stations/3').length).toEqual(16);
                // Expect a time dimension
                expect(item.tableStructure.columnsByType[VarType.TIME].length).toEqual(1);
                // Expect it not to show any concepts to the user.
                expect(item.concepts.length).toEqual(0);
            }).otherwise(fail).then(done);
        });

        it('is less than 2000 characters when serialised to JSON then URLEncoded', function(done) {
            item.updateFromJson({
                name: 'Name',
                url: 'http://sos.example.com',
                procedures: [{identifier: "http://sos.example.com/tstypes/Yearly Mean", title: "Annual average"}],
                observableProperties: [{identifier: "http://sos.example.com/parameters/Storage Level", title: "Storage Level"}],
                initialProcedureIndex: 0,
                tryToLoadObservationData: false
            });
            item.load().then(function() {
                var url = encodeURIComponent(JSON.stringify(item.serializeToJson()));
                expect(url.length).toBeLessThan(2000);
            }).otherwise(fail).then(done);
        });

    });

});
