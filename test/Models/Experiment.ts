import { configure } from 'mobx';
import CatalogGroup from '../../lib/Models/CatalogGroupNew';
import Terria from '../../lib/Models/TerriaNew';

configure({
    enforceActions: true,
    computedRequiresReaction: true
});

describe('NewStuff', function() {
    it('test', function() {
        const terria = new Terria();
        const g = new CatalogGroup(terria);
        // const b = new Bar();

        // autorun(() => {
        //     b.go();
        //     console.log(b.foo);
        //     console.log(b.bar);
        // });
        // const terria = new Terria();
        // const wms = new WebMapServiceCatalogGroup(terria);

        // const wmsItem = new WebMapServiceCatalogItem(terria);
        // wmsItem.definitionStratum.id = 'Taxation Statistics 2011-2012/ckan_95d9e550_8b36_4273_8df7_2b76c140e73a';
        // wmsItem.definitionStratum.name = 'Foo';
        // terria.addModel(wmsItem.definitionStratum.id, wmsItem);

        // const wmsItem2 = new WebMapServiceCatalogItem(terria);
        // wmsItem2.definitionStratum.id = 'another';
        // wmsItem2.definitionStratum.name = 'Another';
        // wmsItem2.definitionStratum.url = 'https://data.gov.au/geoserver/taxation-statistics-2011-12/wms';
        // terria.addModel(wmsItem2.definitionStratum.id, wmsItem2);

        // runInAction(() => {
        //     const definition = wms.strata.get('definition');
        //     definition.members = [wmsItem2.definitionStratum.id];
        //     definition.id = 'Taxation Statistics 2011-2012';
        //     definition.name = 'Taxation Statistics 2011-2012';
        //     definition.url = 'https://data.gov.au/geoserver/taxation-statistics-2011-12/wms';
        // });

        // autorun(dispose => {
        //     console.log('flattened: ' + wms.strata.get('flattened'));
        //     console.log('Run: ' + wms.memberModels.length);
        //     wms.memberModels.forEach(model => {
        //         console.log(`${model.name}: ${model.id}`);
        //         if (Mappable.is(model)) {
        //             console.log(model.mapItems);
        //         }
        //     });
        // });
    });
});
