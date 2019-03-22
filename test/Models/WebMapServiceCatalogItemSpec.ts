import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem';
import { autorun, runInAction, observable } from 'mobx';
import Terria from '../../lib/Models/Terria';

describe('WebMapServiceCatalogItem', function() {
    it('derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogItem('test', terria);
        const definition = wms.getOrCreateStratum('definition');
        definition.url = 'http://www.example.com';
        expect(wms.getCapabilitiesUrl).toBeDefined();
        expect(wms.url).toBeDefined();
        expect(wms.getCapabilitiesUrl && wms.getCapabilitiesUrl.indexOf(wms.url || 'undefined') === 0).toBe(true);
    });

    it('loads', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogItem('test', terria);
        const definition = wms.getOrCreateStratum('definition');
        definition.url = 'https://programs.communications.gov.au/geoserver/ows';
        definition.layers = 'mobile-black-spot-programme:funded-base-stations-group';
        wms.loadData();
        autorun(() => {
            console.log(wms.availableStyles);
        });
    });

    it('updates description from a GetCapabilities', function(done) {
        let wms: WebMapServiceCatalogItem;
        const terria = new Terria();
        wms = new WebMapServiceCatalogItem('test', terria);
        runInAction(() => {
            const definition = wms.getOrCreateStratum('definition');
            definition.url = 'https://programs.communications.gov.au/geoserver/ows';
            definition.layers = 'mobile-black-spot-programme:funded-base-stations-group';
        });
        let description: String | undefined;
        const cleanup = autorun(() => {
            if (wms.info !== undefined) {
                const descSection = wms.info.find(section => section.name === 'Data Description');
                if (descSection !== undefined && descSection.content !== undefined) {
                    description = descSection.content;
                }
            }
        });
        autorun(reaction => {
            const p = wms.loadData();
            p.then(() => {
                wms;
                expect(description).toBe('Layer-Group type layer: mobile-black-spot-programme:funded-base-stations-group');
                cleanup();
                done();
            }, err => {
                fail(err);
                cleanup();
                done();
            });
            reaction.dispose();
        });
    });
});
