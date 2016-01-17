'use strict';

/*global require*/
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

var Terria = require('../../lib/Models/Terria');
var AbsIttCatalogItem = require('../../lib/Models/AbsIttCatalogItem');

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


});
