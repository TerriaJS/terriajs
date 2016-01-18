'use strict';

/*global require, fail*/
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

var Terria = require('../../lib/Models/Terria');
var AbsIttCatalogItem = require('../../lib/Models/AbsIttCatalogItem');

var sinon = require('sinon');
// var URI = require('urijs');

describe('AbsIttCatalogItem', function() {
    var terria;
    var item;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        item = new AbsIttCatalogItem(terria);
    });

    // Is this an important feature?
    // it('defaults to having no dataUrl', function() {
    //     item.url = 'http://foo.bar';
    //     expect(item.dataUrl).toBeUndefined();
    //     expect(item.dataUrlType).toBeUndefined();
    // });

    it('uses explicitly-provided dataUrl and dataUrlType', function() {
        item.dataUrl = 'http://foo.com/data';
        item.dataUrlType = 'wfs-complete';
        item.url = 'http://foo.com/somethingElse';
        expect(item.dataUrl).toBe('http://foo.com/data');
        expect(item.dataUrlType).toBe('wfs-complete');
    });

    it('can update from json', function() {
        item.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://foo.bar',
            dataCustodian: 'Data Custodian',
        });
        expect(item.name).toBe('Name');
        expect(item.description).toBe('Description');
        expect(item.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(item.type).toBe('abs-itt');
        expect(item.url.indexOf('http://foo.bar')).toBe(0);
        expect(item.dataCustodian).toBe('Data Custodian');
    });

    describe('loading', function() {
        var fakeServer;

        beforeEach(function() {
            fakeServer = sinon.fakeServer.create();
            fakeServer.autoRespond = true;

            fakeServer.respond(function(request) {
                fail('Unhandled request to URL: ' + request.url);
            });

            fakeServer.respondWith(
                'GET',
                'data/abs_names.json',
                JSON.stringify({
                    AGE: "Age",
                    MEASURE : {
                        "Persons" : "Sex",
                        "85 years and over" : "Age",
                        "*" : "Measure"
                    }
                })
            );

            fakeServer.respondWith(
                'GET',
                'http://abs.example.com/?method=GetDatasetConcepts&datasetid=foo&format=json',
                JSON.stringify({
                    concepts: [
                        "FREQUENCY",
                        "STATE",
                        "AGE",
                        "REGIONTYPE",
                        "REGION"
                    ]
                })
            );

            fakeServer.respondWith(
                'GET',
                'http://abs.example.com/?method=GetCodeListValue&datasetid=foo&concept=AGE&format=json',
                JSON.stringify({
                    codes: [
                        {
                            code: "A02",
                            description: "0-2 years",
                            parentCode: "",
                            parentDescription: ""
                        },
                        {
                            code: "0",
                            description: "0",
                            parentCode: "A02",
                            parentDescription: "0-2 years"
                        },
                        {
                            code: "1",
                            description: "1",
                            parentCode: "A02",
                            parentDescription: "0-2 years"
                        },
                        {
                            code: "2",
                            description: "2",
                            parentCode: "A02",
                            parentDescription: "0-2 years"
                        },
                        {
                            code: "OTHER",
                            description: "Older than 2",
                            parentCode: "",
                            parentDescription: ""
                        }
                    ]
                })
            );

            fakeServer.respondWith(
                'GET',
                'http://abs.example.com/?method=GetCodeListValue&datasetid=foo&concept=REGIONTYPE&format=json',
                JSON.stringify({
                    "codes": [
                        {
                            "code":"AUS",
                            "description":"Australia",
                            "parentCode":"","parentDescription":""
                        },
                        {
                            "code":"SA4",
                            "description":"Statistical Area Level 4",
                            "parentCode":"",
                            "parentDescription":""
                        }
                    ]
                })
            );

            fakeServer.respondWith(
                'GET',
                'data/regionMapping.json',
                JSON.stringify({
                    "regionWmsMap": {
                        "SA4": {
                            "layerName": "region_map:FID_SA4_2011_AUST",
                            "server": "http://geoserver.nationalmap.nicta.com.au/region_map/ows",
                            "regionProp": "SA4_CODE11",
                            "aliases": [
                                "sa4_code_2011",
                                "sa4_code",
                                "sa4"
                            ],
                            "digits": 3,
                            "description": "Statistical Area Level 4",
                            "regionIdsFile": "data/regionids/region_map-FID_SA4_2011_AUST_SA4_CODE11.json"
                        }
                    }
                })
            );

        });

        afterEach(function() {
            fakeServer.restore();
        });

        it('works with no active region', function(done) {

            item.updateFromJson({
                name: 'Name',
                datasetId: 'foo',
                url: 'http://abs.example.com'
            });
            item.load().then(function() {
                return item.dataSource.regionPromise.then(function(regionDetails) {
                    // Just checks that it gets here without any errors.
                    // Since no region column has been selected yet, do not expect any region details.
                    expect(regionDetails).toBeUndefined();
                    expect(item._concepts[0].activeItems.length).toEqual(0);
                }).otherwise(fail);
            }).otherwise(fail).then(done);
        });

    });

});
