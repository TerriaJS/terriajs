import WebMapServiceCatalogGroup from '../../lib/Models/WebMapServiceCatalogGroup';
import { autorun } from 'mobx';
import Terria from '../../lib/Models/Terria';

describe('WebMapServiceCatalogGroup', function() {
    it('derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogGroup('test', terria);
        const definition = wms.getOrCreateStratum('definition');
        definition.url = 'http://www.example.com';
        expect(wms.getCapabilitiesUrl).toBeDefined();
        expect(wms.url).toBeDefined();
        expect(wms.getCapabilitiesUrl && wms.getCapabilitiesUrl.indexOf(wms.url || 'undefined') === 0).toBe(true);
    });

    it('loads', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogGroup('test', terria);
        const definition = wms.getOrCreateStratum('definition');
        definition.url = 'https://programs.communications.gov.au/geoserver/ows';
        autorun(() => {
            console.log(wms.members);
        });
    });
});
