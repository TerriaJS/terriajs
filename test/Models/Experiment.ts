import { autorun, configure, runInAction, observable, decorate, trace } from 'mobx';
import autoUpdate from '../../lib/Core/autoUpdate';
import instanceOf from '../../lib/Core/instanceOf';
import WebMapServiceCatalogGroup from '../../lib/Models/WebMapServiceCatalogGroupNew';
import Terria from '../../lib/Models/TerriaNew';
import Mappable from '../../lib/Models/Mappable';
import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem3';
import Model from '../../lib/Models/Model';

configure({
    enforceActions: true,
    isolateGlobalState: true,
    computedRequiresReaction: true
});

describe('NewStuff', function() {
    it('test', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogGroup(terria);

        const wmsItem = new WebMapServiceCatalogItem(terria);
        wmsItem.definitionStratum.id = 'Taxation Statistics 2011-2012/ckan_95d9e550_8b36_4273_8df7_2b76c140e73a';
        wmsItem.definitionStratum.name = 'Foo';
        terria.addModel(wmsItem.definitionStratum.id, wmsItem);

        const wmsItem2 = new WebMapServiceCatalogItem(terria);
        wmsItem2.definitionStratum.id = 'another';
        wmsItem2.definitionStratum.name = 'Another';
        wmsItem2.definitionStratum.url = 'https://data.gov.au/geoserver/taxation-statistics-2011-12/wms';
        terria.addModel(wmsItem2.definitionStratum.id, wmsItem2);

        runInAction(() => {
            wms.definitionStratum.members = [wmsItem2.definitionStratum.id];
            wms.definitionStratum.id = 'Taxation Statistics 2011-2012';
            wms.definitionStratum.name = 'Taxation Statistics 2011-2012';
            wms.definitionStratum.url = 'https://data.gov.au/geoserver/taxation-statistics-2011-12/wms';
        });

        autorun(dispose => {
            console.log('Run: ' + wms.memberModels.length);
            wms.memberModels.forEach(model => {
                console.log(`${model.name}: ${model.id}`);
                if (Mappable.is(model)) {
                    console.log(model.mapItems);
                }
            });
        });
    });
});
