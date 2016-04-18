'use strict';

/*global require*/
var loadView = require('../Core/loadView');

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var svgMenu = require('../SvgPaths/svgMenu');
var svgCollapse = require('../SvgPaths/svgCollapse');
var triggerResize = require('../Core/triggerResize');

/**
 * The Explorer Panel view model.
 * @alias ExplorerPanelViewModel
 * @constructor
 *
 * @param {Object} options Options.
 * @param {Terria} options.terria The Terria instance.
 * @param {Boolean} [options.isOpen=true] Whether to start with the panel view open.
 * @param {Array} [options.tabs] An array of tabs to display (eg. DataCatalogTabViewModel, nowViewingTab, SearchTabViewModel), if any.
 * @param {String|Element} [mapElementToDisplace] The map element (or its id), eg. 'cesiumContainer',
 *        which is to maintain a 'map-displaced' class when the explorer panel is open.
 * @param {Number} [options.closeAnimationLength=300] Duration of explorer panel close animation (in milliseconds).
 */
var ExplorerPanelViewModel = function(options) {
    this.terria = options.terria;
    this.isOpen = defaultValue(options.isOpen, true);
    this.tabs = [];

    knockout.track(this, ['isOpen', 'tabs']);

    this.svgClose = 'M 6.937799,8.0450206 1.6369862,13.186666 C 1.3832705,13.432763 0.97809202,13.426587 0.73199467,13.172871 0.48589732,12.919156 0.4920732,12.513977 0.74578889,12.26788 L 6.0185862,7.1534091 0.74578889,2.0389383 C 0.4920732,1.792841 0.48589732,1.3876625 0.73199467,1.1339468 0.97809202,0.88023108 1.3832705,0.8740552 1.6369862,1.1201525 l 5.3008128,5.141645 5.300813,-5.141645 c 0.253716,-0.2460973 0.658894,-0.23992142 0.904991,0.013794 0.246098,0.2537157 0.239922,0.6588942 -0.01379,0.9049915 L 7.8570118,7.1534091 13.129809,12.26788 c 0.253716,0.246097 0.259892,0.651276 0.01379,0.904991 -0.246097,0.253716 -0.651275,0.259892 -0.904991,0.0138 L 6.937799,8.0450206 z';
    this.svgMenu = svgMenu;
    this.svgCollapse = svgCollapse;

    var activeTabId = this.terria.getUserProperty('activeTabId');
    knockout.getObservable(this.terria.userProperties, 'activeTabId').subscribe(this._setActiveTabId.bind(this));

    defaultValue(options.tabs, []).forEach(function(tab) {
        // Add all the tabs but don't automatically select one.
        this.addTab(tab, true);
    }, this);

    this._setActiveTabId(activeTabId);

    if (this.tabs.length && this.getActiveTabIndex() === -1) {
        // If we couldn't select a valid tab based on userProperties, just select the first one.
        this.activateTab(this.tabs[0], false);
    }

    var that = this;
    var closeAnimationLength = defaultValue(options.closeAnimationLength, 300);

    function updateDisplacement() {
        if (defined(options.mapElementToDisplace)) {
            var mapElement = getElement(options.mapElementToDisplace);

            if (that.isOpen) {
                if (mapElement.className.indexOf(' map-displaced') < 0) {
                    mapElement.className += ' map-displaced';
                }
            } else {
                mapElement.className = mapElement.className.replace(' map-displaced', '');
            }
        }

        that.terria.currentViewer.notifyRepaintRequired();

        // allow any animations to finish, then trigger a resize.
        setTimeout(function() {
            triggerResize();
        }, closeAnimationLength);
    }

    knockout.getObservable(this, 'isOpen').subscribe(updateDisplacement);
    updateDisplacement();

    function syncHideExplorerPanel() {
        that.terria.userProperties.hideExplorerPanel = that.isOpen ? undefined : 1;
    }
    // Make sure that hideExplorerPanel user property is kept synced.
    syncHideExplorerPanel();
    knockout.getObservable(this, 'isOpen').subscribe(syncHideExplorerPanel);
};

/**
 * Shows this panel by adding it to the DOM inside a given container element.
 * @param {DOMNode} container The DOM node to which to add this panel.
 */
ExplorerPanelViewModel.prototype.show = function(container) {
    loadView(require('../Views/ExplorerPanel.html'), container, this);
};
/**
 * Adds a tab to the panel.
 *
 * @param tabViewModel {ExplorerTabViewModel} The ViewModel of the tab to add
 * @param doNotActivate {boolean} Stops the tab being automatically activated if it's the only one in the panel.
 * @returns {ExplorerTabViewModel} The tab that was added.
 */
ExplorerPanelViewModel.prototype.addTab = function(tabViewModel, doNotActivate) {
    this._ensureUniqueTabId(tabViewModel);

    tabViewModel.panel = this;

    this.tabs.push(tabViewModel);

    if (!doNotActivate && this.tabs.length === 1) {
        this.activateTab(tabViewModel);
    }

    return tabViewModel;
};

ExplorerPanelViewModel.prototype.activateTab = function(tab, openPanel) {
    for (var i = 0; i < this.tabs.length; ++i) {
        // Set new tab active, other tabs inactive.
        this.tabs[i].isActive = this.tabs[i] === tab;
    }

    if (defaultValue(openPanel, true)) {
        this.isOpen = true;
    }

    this.terria.userProperties.activeTabId = tab.id;
};

ExplorerPanelViewModel.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

ExplorerPanelViewModel.prototype.open = function() {
    this.isOpen = true;
};

ExplorerPanelViewModel.prototype.close = function() {
    this.isOpen = false;
};

ExplorerPanelViewModel.prototype.getActiveTabIndex = function() {
    for (var i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].isActive) {
            return i;
        }
    }

    return -1;
};

ExplorerPanelViewModel.create = function(options) {
    var result = new ExplorerPanelViewModel(options);
    result.show(options.container);
    return result;
};

ExplorerPanelViewModel.prototype._setActiveTabId = function(id) {
    for (var i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].id === id) {
            this.activateTab(this.tabs[i], false);
        }
    }
};

/**
 * Checks to see if a tab's id would conflict with any others in this.tabs - if so it warns the developer and makes
 * the id unique.
 *
 * @param {ExplorerTabViewModel} tabViewModel The tab to make unique
 * @private
 */
ExplorerPanelViewModel.prototype._ensureUniqueTabId = function(tabViewModel) {
    var tabIndex = this.tabs.reduce(function(indexSoFar, tab) {
        indexSoFar[tab.id] = tab;
        return indexSoFar;
    }, {});

    if (tabIndex[tabViewModel.id]) {
        // Tab with this id has already been added.
        console.warn('Attempted to add > 1 tab with the same id "' + tabViewModel.id + '" to an ' +
            'ExplorerPanelView. This is not recommended as it can break share links.');

        while (tabIndex[tabViewModel.id]) {
            // Just change the id slightly to make it work.
            tabViewModel.id += 'i';
        }
    }
};


module.exports = ExplorerPanelViewModel;
