'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
import defined from 'terriajs-cesium/Source/Core/defined';

/**
 * Root of a global view model. Presumably this should get nested as more stuff goes into it. Basically this belongs to
 * the root of the UI and then it can choose to pass either the whole thing or parts down as props to its children.
 */

export default class ViewState {
    constructor() {
        this.mobileViewOptions = Object.freeze({
            data: 'data',
            preview: 'preview',
            nowViewing: 'nowViewing',
            search: 'search'
        });

        this.componentOrderOptions = Object.freeze({
            chart: 0,
            featureInfoPanel: 1,
            modelWindow: 2
        });

        this.previewedItem = undefined;
        this.userDataPreviewedItem = undefined;
        this.catalogSearch = '';
        this.modalVisible = true;
        this.modalTabIndex = 0;
        this.isDraggingDroppingFile = false;
        this.mobileView = null;
        this.componentOnTop = this.componentOrderOptions.chart;


        knockout.track(this, ['previewedItem', 'catalogSearch', 'modalVisible', 'modalTabIndex', 'userDataPreviewedItem', 'isDraggingDroppingFile', 'mobileView', 'componentOnTop']);
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

    viewCatalogItem(item) {
        if (addedByUser(item)) {
            this.userDataPreviewedItem = item;
            this.openUserData();
        } else {
            this.previewedItem = item;
            this.openAddData();
        }
    }

    toggleModal(bool) {
        this.modalVisible = bool;
    }

    switchMobileView(viewName){
        this.mobileView = viewName;
    }

    switchComponentOrder(component){
        this.componentOnTop = component;
    }
}

function addedByUser(item) {
    while(defined(item.parent)){
        if (item.parent.name === 'User-Added Data'){
            return true;
        }
        item = item.parent;
    }
    return false;
}
