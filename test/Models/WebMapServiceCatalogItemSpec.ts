import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem3';
import { autorun } from 'mobx';

describe('WebMapServiceCatalogItem', function() {
    it('derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified', function() {
        const wms = new WebMapServiceCatalogItem();
        wms.url = 'http://www.example.com';
        expect(wms.getCapabilitiesUrl.indexOf(wms.url) === 0).toBe(true);
    });

    it('loads', function() {
        const wms = new WebMapServiceCatalogItem();
        wms.url = 'https://programs.communications.gov.au/geoserver/ows';
        wms.layers = 'mobile-black-spot-programme:funded-base-stations-group';
        autorun(() => {
            console.log(wms.availableStyles);
        });
    });
});
