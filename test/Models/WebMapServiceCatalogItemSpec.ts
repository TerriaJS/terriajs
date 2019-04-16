import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem';
import { autorun, runInAction, observable } from 'mobx';
import Terria from '../../lib/Models/Terria';
import { ImageryParts } from '../../lib/Models/Mappable';
import WebMapServiceImageryProvider from 'terriajs-cesium/Source/Scene/WebMapServiceImageryProvider';

describe('WebMapServiceCatalogItem', function() {
    it('derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogItem('test', terria);
        wms.setTrait('definition', 'url', 'http://www.example.com');
        expect(wms.getCapabilitiesUrl).toBeDefined();
        expect(wms.url).toBeDefined();
        expect(wms.getCapabilitiesUrl && wms.getCapabilitiesUrl.indexOf(wms.url || 'undefined') === 0).toBe(true);
    });

    it('loads', function() {
        expect().nothing();
        const terria = new Terria();
        const wms = new WebMapServiceCatalogItem('test', terria);
        runInAction(() => {
            wms.setTrait('definition', 'url', 'https://programs.communications.gov.au/geoserver/ows');
            wms.setTrait('definition', 'layers', 'mobile-black-spot-programme:funded-base-stations-group');
        });
        return wms.loadMapItems();
    });

    it('updates description from a GetCapabilities', async function() {
        let wms: WebMapServiceCatalogItem;
        const terria = new Terria();
        wms = new WebMapServiceCatalogItem('test', terria);
        runInAction(() => {
            wms.setTrait('definition', 'url', 'https://programs.communications.gov.au/geoserver/ows');
            wms.setTrait('definition', 'layers', 'mobile-black-spot-programme:funded-base-stations-group');
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
        try {
            await wms.loadMetadata();
            expect(description).toBe('Layer-Group type layer: mobile-black-spot-programme:funded-base-stations-group');
        }
        finally {
            cleanup();
        }

    });

    it('correctly contstructs ImageryProvider', async function() {
        let wms: WebMapServiceCatalogItem;
        const terria = new Terria();
        wms = new WebMapServiceCatalogItem('test', terria);
        runInAction(() => {
            wms.setTrait('definition', 'url', 'https://programs.communications.gov.au/geoserver/ows');
            wms.setTrait('definition', 'layers', 'mobile-black-spot-programme:funded-base-stations-group');
        });
        let mapItems: ImageryParts[] = [];
        const cleanup = autorun(() => {
            mapItems = wms.mapItems.slice();
        });
        try {
            await wms.loadMetadata();
            expect(mapItems.length).toBe(1);
            expect(mapItems[0].alpha).toBeCloseTo(0.8);
            expect(mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider).toBeTruthy();
            if (mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider) {
                expect(mapItems[0].imageryProvider.url).toBe('https://programs.communications.gov.au/geoserver/ows');
            }
        }
        finally {
            cleanup();
        }
    });
});
