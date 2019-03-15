import addedByUser from '../Core/addedByUser';
import clone from 'terriajs-cesium/Source/Core/clone';
import defined from 'terriajs-cesium/Source/Core/defined';
import DisclaimerHandler from './DisclaimerHandler';
import getAncestors from '../Models/getAncestors';
import MouseCoords from './MouseCoords';
import SearchState from './SearchState';
import Terria from '../Models/Terria';
import { observable, reaction, IReactionDisposer } from 'mobx';
import { BaseModel } from '../Models/Model';
import PickedFeatures from '../Map/PickedFeatures';

interface ViewStateOptions {
    terria: Terria;
    catalogSearchProvider: any;
    locationSearchProviders: any[];
}

/**
 * Root of a global view model. Presumably this should get nested as more stuff goes into it. Basically this belongs to
 * the root of the UI and then it can choose to pass either the whole thing or parts down as props to its children.
 */

export default class ViewState {
    readonly mobileViewOptions = Object.freeze({
        data: 'data',
        preview: 'preview',
        nowViewing: 'nowViewing',
        locationSearchResults: 'locationSearchResults'
    });
    readonly searchState: SearchState;
    readonly terria: Terria;

    @observable previewedItem: BaseModel | undefined;
    @observable userDataPreviewedItem: BaseModel | undefined;
    @observable explorerPanelIsVisible: boolean = false;
    @observable activeTabCategory: string = 'data-catalog';
    @observable activeTabIdInCategory: string | undefined = undefined;
    @observable isDraggingDroppingFile: boolean = false;
    @observable mobileView: string | null = null;
    @observable isMapFullScreen: boolean = false;
    @observable readonly notifications: any[] = [];
    @observable myDataIsUploadView: boolean = true;
    @observable mouseCoords: MouseCoords = new MouseCoords();
    @observable mobileMenuVisible: boolean = false;
    @observable explorerPanelAnimating: boolean = false;
    @observable topElement: string = 'FeatureInfo';

    /**
     * Gets or sets a value indicating whether the small screen (mobile) user interface should be used.
     * @type {Boolean}
     */
    @observable useSmallScreenInterface: boolean = false;

    /**
     * Gets or sets a value indicating whether the feature info panel is visible.
     * @type {Boolean}
     */
    @observable featureInfoPanelIsVisible: boolean = false;

    /**
     * Gets or sets a value indicating whether the feature info panel is collapsed.
     * When it's collapsed, only the title bar is visible.
     * @type {Boolean}
     */
    @observable featureInfoPanelIsCollapsed: boolean = false;

    /**
     * True if this is (or will be) the first time the user has added data to the map.
     * @type {Boolean}
     */
    @observable firstTimeAddingData: boolean = true;

    /**
     * Gets or sets a value indicating whether the feedback form is visible.
     * @type {Boolean}
     */
    @observable feedbackFormIsVisible: boolean = false;

    private _unsubscribeErrorListener: any;
    private _pickedFeaturesSubscription: IReactionDisposer;
    private _isMapFullScreenSubscription: IReactionDisposer;
    private _mobileMenuSubscription: IReactionDisposer;
    private _disclaimerHandler: DisclaimerHandler;

    constructor(options: ViewStateOptions) {
        const terria = options.terria;

        this.searchState = new SearchState({
            terria: terria,
            catalogSearchProvider: options.catalogSearchProvider,
            locationSearchProviders: options.locationSearchProviders
        });

        this.terria = terria;

        // Show errors to the user as notifications.
        this._unsubscribeErrorListener = terria.error.addEventListener(<any>((e: any) => {
            // Only add this error if an identical one doesn't already exist.
            if (this.notifications.filter(item => item.title === e.title && item.message === e.message).length === 0) {
                this.notifications.push(clone(e));
            }
        }));

        // When features are picked, show the feature info panel.
        this._pickedFeaturesSubscription = reaction(() => this.terria.pickedFeatures, (pickedFeatures: PickedFeatures | undefined) => {
            if (defined(pickedFeatures)) {
                this.featureInfoPanelIsVisible = true;
                this.featureInfoPanelIsCollapsed = false;
            }
        });

        this._isMapFullScreenSubscription = reaction(() => terria.userProperties.get('hideWorkbench') === '1' || terria.userProperties.get('hideExplorerPanel') === '1', (isMapFullScreen: boolean) => {
            this.isMapFullScreen = isMapFullScreen;
        });

        this._mobileMenuSubscription = reaction(() => this.mobileMenuVisible, (mobileMenuVisible: boolean) => {
            if (mobileMenuVisible) {
                this.explorerPanelIsVisible = false;
                this.switchMobileView(null);
            }
        });

        this._disclaimerHandler = new DisclaimerHandler(terria, this);
    }

    dispose() {
        this._pickedFeaturesSubscription();
        this._unsubscribeErrorListener();
        this._mobileMenuSubscription();
        this._isMapFullScreenSubscription();
        this._disclaimerHandler.dispose();
    }

    openAddData() {
        this.explorerPanelIsVisible = true;
        this.activeTabCategory = 'data-catalog';
    }

    openUserData() {
        this.explorerPanelIsVisible = true;
        this.activeTabCategory = 'my-data';
    }

    closeCatalog() {
        this.explorerPanelIsVisible = false;
    }

    searchInCatalog(query: string) {
        this.openAddData();
        this.searchState.catalogSearchText = query;
        this.searchState.searchCatalog();
    }

    viewCatalogMember(catalogMember: BaseModel) {
        if (addedByUser(catalogMember)) {
            this.userDataPreviewedItem = catalogMember;
            this.openUserData();
        } else {
            this.previewedItem = catalogMember;
            this.openAddData();
            if (this.terria.configParameters.tabbedCatalog) {
                // Go to specific tab
                this.activeTabIdInCategory = getAncestors(catalogMember)[0].name;
            }
        }
    }

    switchMobileView(viewName: string | null){
        this.mobileView = viewName;
    }

    getNextNotification() {
        return this.notifications.length && this.notifications[0];
    }

    hideMapUi() {
        return this.getNextNotification() && this.getNextNotification().hideUi;
    }
}
