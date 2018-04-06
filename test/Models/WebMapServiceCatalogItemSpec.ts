import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem3';

describe('WebMapServiceCatalogItem', function() {
    it('derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified', function() {
        const wms = new WebMapServiceCatalogItem();
        wms.url = 'http://www.example.com';
        expect(wms.getCapabilitiesUrl.indexOf(wms.url) === 0).toBe(true);
    });
});
