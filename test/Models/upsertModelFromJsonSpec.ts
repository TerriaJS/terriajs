import upsertModelFromJson from "../../lib/Models/upsertModelFromJson";
import ModelFactory from "../../lib/Models/ModelFactory";
import Terria from "../../lib/Models/TerriaNew";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem3";

describe('loadModel', function() {
    it('test', function() {
        const modelFactory = new ModelFactory();
        modelFactory.register(WebMapServiceCatalogItem.type, WebMapServiceCatalogItem);

        const terria = new Terria();

        const json = {
            type: 'wms',
            name: 'Test',
            url: 'https://programs.communications.gov.au/geoserver/ows',
            layers: 'mybroadband:MyBroadband_ADSL_Availability'
        };

        const model = upsertModelFromJson(modelFactory, terria, '', undefined, 'definition', json);
        console.log(model);
    });
});
