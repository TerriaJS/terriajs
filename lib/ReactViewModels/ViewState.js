'use strict';

/*global require*/
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * Root of a global view model. Presumably this should get nested as more stuff goes into it. Basically this belongs to
 * the root of the UI and then it can choose to pass either the whole thing or parts down as props to its children.
 */
export default class ViewState {
    constructor() {
        this.previewedItem = undefined;
        this.catalogSearch = '';
        this.modalVisible = false;
        this.modalTabIndex = 0;

        knockout.track(this, ['previewedItem', 'catalogSearch', 'modalVisible', 'modalTabIndex']);
    }

    openAddData() {
        this.modalVisible = true;
        this.modalTabIndex = 1;
    }

    searchInCatalog(query) {
        this.openAddData();
        this.catalogSearch = query;
    }

    viewCatalogItem(item) {
        this.previewedItem = item;
        this.openAddData();
    }
}
