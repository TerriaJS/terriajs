'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * Root of a global view model. Presumably this should get nested as more stuff goes into it. Basically this belongs to
 * the root of the UI and then it can choose to pass either the whole thing or parts down as props to its children.
 */
export default class ViewState {
    constructor() {
        this.previewedItem = undefined;
        this.userDataPreviewedItem = undefined;
        this.catalogSearch = '';
        this.modalVisible = true;
        this.modalTabIndex = 0;
        this.isDraggingDroppingFile = false;

        knockout.track(this, ['previewedItem', 'catalogSearch', 'modalVisible', 'modalTabIndex', 'userDataPreviewedItem', 'isDraggingDroppingFile', 'isPreviewing']);
    }

    openWelcome() {
        this.modalVisible = true;
        this.modalTabIndex = 0;
    }

    openAddData() {
        this.modalVisible = true;
        this.modalTabIndex = 1;
    }

    openUserData() {
        this.modalVisible = true;
        this.modalTabIndex = 2;
    }

    searchInCatalog(query) {
        this.openAddData();
        this.catalogSearch = query;
    }

    togglePreview(bool){
        this.isPreviewing = bool;
    }

    viewCatalogItem(item) {
        if (item.isUserSupplied) {
            this.userDataPreviewedItem = item;
            this.openUserData();
        } else {
            this.previewedItem = item;
            this.openAddData();
        }
    }
}
