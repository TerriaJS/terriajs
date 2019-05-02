import Mappable from "./Mappable";
import CreateModel from "./CreateModel";
import BingMapsCatalaogItemTraits from "../Traits/BingMapsCatalogItemTraits";
import BingMapsImageryProvider from "terriajs-cesium/Source/Scene/BingMapsImageryProvider";
import Credit from "terriajs-cesium/Source/Core/Credit";
import { computed } from "mobx";

export default class BingMapsCatalaogItem
    extends CreateModel(BingMapsCatalaogItemTraits)
    implements Mappable {
    @computed get mapItems() {
        const imageryProvider = this._createImageryProvider();
        return [
            {
                imageryProvider,
                show: this.show,
                alpha: this.opacity
            }
        ];
    }

    loadMapItems() {
        return Promise.resolve();
    }

    _createImageryProvider() {
        const result = new BingMapsImageryProvider({
            url: "//dev.virtualearth.net",
            mapStyle: this.mapStyle,
            key: this.key
        });

        // open in a new window
        (<any>result)._credit = new Credit(
            '<a href="http://www.bing.com" target="_blank">Bing</a>'
        );
        result.defaultGamma = 1.0;
        return result;
    }
}
