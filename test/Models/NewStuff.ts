import { autorun, configure, runInAction, observable, decorate, trace } from 'mobx';
import autoUpdate from '../../lib/Core/autoUpdate';
import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem3';

configure({
    enforceActions: true,
    computedRequiresReaction: true
});

describe('NewStuff', function() {
    it('test', function(done) {
        const wms = new WebMapServiceCatalogItem();
        console.log(wms.name);
        wms.definitionStratum.name = 'test';
        console.log(wms.name);
        console.log('here');

        wms.description = 'hello';
        console.log(wms.description);

        wms.getCapabilitiesUrl = '/test';
        alert(wms.name);

        autorun(() => {
            console.log('isLoading: ' + wms.getCapabilitiesStratum.isLoading);
        });

        autorun(() => {
            trace();
            console.log('autorun');
            console.log('mapItems: ' + wms.mapItems);
        });

        runInAction(() => {
            wms.getCapabilitiesUrl = '/another';
        });

        setTimeout(() => {
            runInAction(() => {
                wms.getCapabilitiesUrl = '/third';
            });
            done();
        }, 1000);
    });
});
