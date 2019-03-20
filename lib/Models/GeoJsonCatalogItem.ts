import { computed, observable } from "mobx";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import GeoJsonCatalogItemTraits from "../Traits/GeoJsonCatalogItemTraits";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import Mappable from "./Mappable";
import Model from "./Model";
import UrlMixin from "../ModelMixins/UrlMixin";

export default class GeoJsonCatalogItem
    extends UrlMixin(CatalogMemberMixin(Model(GeoJsonCatalogItemTraits)))
    implements Mappable {
    @observable cesiumDataSource?: GeoJsonDataSource;

    @observable
    show: boolean = true;

    @computed
    get mapItems() {
        if (this.cesiumDataSource === undefined) {
            return [];
        }
        this.cesiumDataSource.show = this.show;
        return [this.cesiumDataSource];
    }

    loadMetadata(): Promise<void> {
        return Promise.resolve();
    }

    loadData(): Promise<void> {
        if (this.url === undefined) {
            return Promise.resolve();
        }
        return GeoJsonDataSource.load(this.url).then(dataSource => {
            this.cesiumDataSource = dataSource;
        });
    }
}
