import { autorun, configure, runInAction, spy } from "mobx";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import { BaseModel } from "../../lib/Models/Model";
import Terria from "../../lib/Models/Terria";
import upsertModelFromJson from "../../lib/Models/upsertModelFromJson";
import WebMapServiceCatalogGroup from "../../lib/Models/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";

describe('upsertModelFromJson', function() {
    it('can create basic WMS item', function() {
        CatalogMemberFactory.register(WebMapServiceCatalogItem.type, WebMapServiceCatalogItem);

        const terria = new Terria();

        const json = {
            type: 'wms',
            name: 'Test',
            url: 'https://programs.communications.gov.au/geoserver/ows',
            layers: 'mybroadband:MyBroadband_ADSL_Availability'
        };

        const model = upsertModelFromJson(CatalogMemberFactory, terria, '', undefined, 'definition', json);
        expect(model instanceof WebMapServiceCatalogItem).toBe(true);
        expect(model.type).toBe('wms');

        const wms = <WebMapServiceCatalogItem>model;
        expect(wms.name).toBe('Test');
        expect(wms.url).toBe('https://programs.communications.gov.au/geoserver/ows');
        expect(wms.layers).toBe('mybroadband:MyBroadband_ADSL_Availability')
    });

    it('can merge members from multiple strata', function(done) {
        CatalogMemberFactory.register(WebMapServiceCatalogGroup.type, WebMapServiceCatalogGroup);
        CatalogMemberFactory.register(WebMapServiceCatalogItem.type, WebMapServiceCatalogItem);

        const terria = new Terria();

        const json = {
            type: 'wms-group',
            name: 'Test',
            url: 'https://programs.communications.gov.au/geoserver/ows',
            members: [
                {
                    type: 'wms',
                    localId: 'mybroadband%3AMyBroadband_ADSL_Availability',
                    name: 'Override'
                }
            ]
        };

        const model = runInAction(() => {
            const model = upsertModelFromJson(CatalogMemberFactory, terria, '', undefined, 'definition', json);
            expect(model instanceof WebMapServiceCatalogGroup).toBe(true);
            expect(model.type).toBe('wms-group');
            return model;
        });

        const group = <WebMapServiceCatalogGroup>model;

        const beforeIsLoadingOverTime: boolean[] = [];
        const afterIsLoadingOverTime: boolean[] = [];
        const memberModelsOverTime: ReadonlyArray<BaseModel>[] = [];
        const dispose = autorun(() => {
            beforeIsLoadingOverTime.push(group.isLoading);
            memberModelsOverTime.push(group.memberModels);
            afterIsLoadingOverTime.push(group.isLoading);
        });

        expect(beforeIsLoadingOverTime.length).toBe(1);
        expect(beforeIsLoadingOverTime[0]).toBe(false);
        expect(afterIsLoadingOverTime[0]).toBe(true);
        expect(memberModelsOverTime[0].length).toBe(1);

        group.loadPromise.then(() => {
            expect(beforeIsLoadingOverTime.length).toBe(2);
            expect(beforeIsLoadingOverTime[1]).toBe(false);
            expect(afterIsLoadingOverTime[1]).toBe(false);
            expect(memberModelsOverTime[1].length).toBeGreaterThan(1);
        }).then(() => {
            const item = terria.getModelById(WebMapServiceCatalogItem, '/Test/mybroadband%3AMyBroadband_ADSL_Availability');
            expect(item).toBeDefined();
            if (!item) {
                return;
            }

            const layersOverTime: (string | undefined)[] = [];
            const isGeoServerOverTime: (boolean | undefined)[] = [];
            const itemDispose = autorun(() => {
                expect(group.memberModels).toContain(item);
                layersOverTime.push(item.layers);
                isGeoServerOverTime.push(item.isGeoServer);
            });

            expect(layersOverTime.length).toBe(1);
            expect(layersOverTime[0]).toBe('mybroadband:MyBroadband_ADSL_Availability');
            expect(isGeoServerOverTime[0]).toBe(false);

            item.loadPromise.then(() => {
                expect(layersOverTime.length).toBe(2);
                expect(layersOverTime[1]).toBe('mybroadband:MyBroadband_ADSL_Availability');
                expect(isGeoServerOverTime[1]).toBe(true);
                itemDispose();
                dispose();
                done();
            });
        });
    });
});
