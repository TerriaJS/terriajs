
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

export default class SearchState {
    constructor() {
        this.catalogSearch = '';
        this.hideSearch = false;

        knockout.track(this, ['catalogSearch', 'hideSearch']);
    }
}
