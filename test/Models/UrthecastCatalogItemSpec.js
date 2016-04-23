'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
var UrthecastCatalogItem = require('../../lib/Models/UrthecastCatalogItem');

describe('UrthecastCatalogItem', function() {
    var terria;
    var urthecastCatalogItem;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });

        urthecastCatalogItem = new UrthecastCatalogItem(terria);

        urthecastCatalogItem.name = 'True RGB';
        urthecastCatalogItem.platform = 'theia';
        urthecastCatalogItem.renderer = 'rgb';
    });

    it('has sensible type and typeName', function() {
        expect(urthecastCatalogItem.type).toBe('urthecast');
        expect(urthecastCatalogItem.typeName).toBe('Urthecast Map Tiles Service Renderer');
    });

    it('can be constructed', function() {
        expect(urthecastCatalogItem).toBeDefined();
    });

    it('is derived from ImageryLayerCatalogItem', function() {
        expect(urthecastCatalogItem instanceof ImageryLayerCatalogItem).toBe(true);
    });

    it('contains correct info sections', function() {
        expect(urthecastCatalogItem.metadata).toBeDefined();

        expect(urthecastCatalogItem.info.length).toBe(2);

        // Renderer info section
        expect(urthecastCatalogItem.info[0].name).toBe(urthecastCatalogItem.name);

        // Sensor platform info section
        expect(urthecastCatalogItem.info[1].content.indexOf('Theia')).not.toBe(-1);
    });
});
