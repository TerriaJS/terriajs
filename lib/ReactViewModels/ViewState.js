import addedByUser from '../Core/addedByUser';
import clone from 'terriajs-cesium/Source/Core/clone';
import defined from 'terriajs-cesium/Source/Core/defined';
import DisclaimerHandler from './DisclaimerHandler';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import MouseCoords from './MouseCoords';
import SearchState from './SearchState';

/**
 * Root of a global view model. Presumably this should get nested as more stuff goes into it. Basically this belongs to
 * the root of the UI and then it can choose to pass either the whole thing or parts down as props to its children.
 */

export default class ViewState {
    constructor(options) {
        const terria = options.terria;

        this.mobileViewOptions = Object.freeze({
            data: 'data',
            preview: 'preview',
            nowViewing: 'nowViewing',
            locationSearchResults: 'locationSearchResults'
        });

        this.searchState = new SearchState({
            terria: terria,
            catalogSearchProvider: options.catalogSearchProvider,
            locationSearchProviders: options.locationSearchProviders
        });

        this.terria = terria;
        this.previewedItem = undefined;
        this.userDataPreviewedItem = undefined;
        this.explorerPanelIsVisible = false;
        this.modalTabIndex = 0;
        this.isDraggingDroppingFile = false;
        this.mobileView = null;
        this.isMapFullScreen = false;
        this.myDataIsUploadView = true;

        /**
         * Gets or sets a value indicating whether the small screen (mobile) user interface should be used.
         * @type {Boolean}
         */
        this.useSmallScreenInterface = false;

        /**
         * Gets or sets a value indicating whether the feature info panel is visible.
         * @type {Boolean}
         */
        this.featureInfoPanelIsVisible = false;

        /**
         * Gets or sets a value indicating whether the feature info panel is collapsed.
         * When it's collapsed, only the title bar is visible.
         * @type {Boolean}
         */
        this.featureInfoPanelIsCollapsed = false;

        /**
         * True if this is (or will be) the first time the user has added data to the map.
         * @type {Boolean}
         */
        this.firstTimeAddingData = true;

        this.notifications = [];

        /**
         * Gets or sets a value indicating whether the feedback form is visible.
         * @type {Boolean}
         */
        this.feedbackFormIsVisible = false;

        this.myDataIsUploadView = true;

        this.mouseCoords = new MouseCoords();

        this.mobileMenuVisible = false;

        this.panelVisible = undefined;

        this.explorerPanelAnimating = false;

        knockout.track(this, [
            'previewedItem',
            'catalogSearch',
            'explorerPanelIsVisible',
            'modalTabIndex',
            'userDataPreviewedItem',
            'isDraggingDroppingFile',
            'mobileView',
            'useSmallScreenInterface',
            'featureInfoPanelIsVisible',
            'featureInfoPanelIsCollapsed',
            'notifications',
            'isMapFullScreen',
            'feedbackFormIsVisible',
            'myDataIsUploadView',
            'mobileMenuVisible',
            'panelVisible',
            'explorerPanelAnimating'
        ]);

        // Show errors to the user as notifications.
        this._unsubscribeErrorListener = terria.error.addEventListener(e => {
            // Only add this error if an identical one doesn't already exist.
            if (this.notifications.filter(item => item.title === e.title && item.message === e.message).length === 0) {
                this.notifications.push(clone(e));
            }
        });

        // When features are picked, show the feature info panel.
        this._pickedFeaturesSubscription = knockout.getObservable(terria, 'pickedFeatures').subscribe(pickedFeatures => {
            if (defined(pickedFeatures)) {
                this.featureInfoPanelIsVisible = true;
                this.featureInfoPanelIsCollapsed = false;
            }
        }, this);

        this._mobileMenuSubscription = knockout.getObservable(this, 'mobileMenuVisible').subscribe(mobileMenuVisible => {
            if (mobileMenuVisible) {
                this.explorerPanelIsVisible = false;
                this.switchMobileView(null);
            }
        });

        this._disclaimerHandler = new DisclaimerHandler(terria, this);
    }

    dispose() {
        this._pickedFeaturesSubscription.dispose();
        this._unsubscribeErrorListener();
        this._mobileMenuSubscription.dispose();
        this._disclaimerHandler.dispose();
    }

    openAddData() {
        this.explorerPanelIsVisible = true;
        this.modalTabIndex = 0;
    }

    openUserData() {
        this.explorerPanelIsVisible = true;
        this.modalTabIndex = 1;
    }

    closeCatalog() {
        this.explorerPanelIsVisible = false;
    }

    searchInCatalog(query) {
        this.openAddData();
        this.searchState.catalogSearchText = query;
        this.searchState.searchCatalog();
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

    switchMobileView(viewName){
        this.mobileView = viewName;
    }

    getNextNotification() {
        return this.notifications[0];
    }

    hideMapUi() {
        return this.getNextNotification() && this.getNextNotification().hideUi;
    }
}
