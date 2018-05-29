import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem3';
import { autorun } from 'mobx';
import Terria from '../../lib/Models/TerriaNew';

describe('WebMapServiceCatalogItem', function() {
    it('derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogItem(terria);
        const definition = wms.addStratum('definition');
        definition.url = 'http://www.example.com';
        expect(wms.getCapabilitiesUrl.indexOf(wms.url) === 0).toBe(true);
    });

    it('loads', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogItem(terria);
        const definition = wms.addStratum('definition');
        definition.url = 'https://programs.communications.gov.au/geoserver/ows';
        definition.layers = 'mobile-black-spot-programme:funded-base-stations-group';
        autorun(() => {
            console.log(wms.availableStyles);
        });
    });
});
