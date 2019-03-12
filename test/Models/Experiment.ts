import { autorun, configure, runInAction } from 'mobx';
import CatalogMemberMixin from '../../lib/ModelMixins/CatalogMemberMixin';
import CommonStrata from '../../lib/Models/CommonStrata';
import Mappable from '../../lib/Models/Mappable';
import Terria from '../../lib/Models/Terria';
import WebMapServiceCatalogGroup from '../../lib/Models/WebMapServiceCatalogGroup';
import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem';

configure({
    enforceActions: true,
    computedRequiresReaction: true
});

describe('NewStuff', function() {
    it('test', function() {
        const terria = new Terria();
        const wms = new WebMapServiceCatalogGroup('Taxation Statistics 2011-2012', terria);

        const wmsItem = new WebMapServiceCatalogItem('Taxation Statistics 2011-2012/ckan_95d9e550_8b36_4273_8df7_2b76c140e73a', terria);
        const definition = wmsItem.getOrCreateStratum(CommonStrata.definition);
        definition.name = 'Foo';
        terria.addModel(wmsItem);

        const wmsItem2 = new WebMapServiceCatalogItem('another', terria);
        const definition2 = wmsItem2.getOrCreateStratum(CommonStrata.definition);
        definition2.name = 'Another';
        definition2.url = 'https://data.gov.au/geoserver/taxation-statistics-2011-12/wms';
        terria.addModel(wmsItem2);

        runInAction(() => {
            const definition = wms.getOrCreateStratum('definition');
            definition.members = [wmsItem2.id];
            definition.name = 'Taxation Statistics 2011-2012';
            definition.url = 'https://data.gov.au/geoserver/taxation-statistics-2011-12/wms';
        });

        autorun(dispose => {
            console.log('flattened: ' + wms.flattened);
            console.log('Run: ' + wms.memberModels.length);
            wms.memberModels.forEach(model => {
                if (CatalogMemberMixin.isMixedInto(model)) {
                    console.log(`${model.name}: ${model.id}`);
                }
                if (Mappable.is(model)) {
                    console.log(model.mapItems);
                }
            });
        });
    });
});
