import { configure, runInAction, autorun } from 'mobx';
import CatalogGroup from '../../lib/Models/CatalogGroupNew';
import Terria from '../../lib/Models/TerriaNew';
import WebMapServiceCatalogGroup from '../../lib/Models/WebMapServiceCatalogGroupNew';
import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem3';
import CommonStrata from '../../lib/Models/CommonStrata';
import Mappable from '../../lib/Models/Mappable';
import CatalogMemberMixin from '../../lib/ModelMixins/CatalogMemberMixin';

configure({
    enforceActions: true,
    computedRequiresReaction: true
});

describe('NewStuff', function() {
    it('test', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogGroup(terria);

        const wmsItem = new WebMapServiceCatalogItem(terria);
        const definition = wmsItem.addStratum(CommonStrata.definition);
        definition.id = 'Taxation Statistics 2011-2012/ckan_95d9e550_8b36_4273_8df7_2b76c140e73a';
        definition.name = 'Foo';
        terria.addModel(definition.id, wmsItem);

        const wmsItem2 = new WebMapServiceCatalogItem(terria);
        const definition2 = wmsItem2.addStratum(CommonStrata.definition);
        definition2.id = 'another';
        definition2.name = 'Another';
        definition2.url = 'https://data.gov.au/geoserver/taxation-statistics-2011-12/wms';
        terria.addModel(definition2.id, wmsItem2);

        runInAction(() => {
            const definition = wms.addStratum('definition');
            definition.members = [definition2.id];
            definition.id = 'Taxation Statistics 2011-2012';
            definition.name = 'Taxation Statistics 2011-2012';
            definition.url = 'https://data.gov.au/geoserver/taxation-statistics-2011-12/wms';
        });

        autorun(dispose => {
            console.log('flattened: ' + wms.flattened);
            console.log('Run: ' + wms.memberModels.length);
            wms.memberModels.forEach(model => {
                if (CatalogMemberMixin.is(model)) {
                    console.log(`${model.name}: ${model.id}`);
                }
                if (Mappable.is(model)) {
                    console.log(model.mapItems);
                }
            });
        });
    });
});
