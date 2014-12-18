'use strict';

/*global require*/
var fs = require('fs');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var createFragmentFromTemplate = require('../Core/createFragmentFromTemplate');

var html = fs.readFileSync(__dirname + '/../Views/ExplorerPanel.html', 'utf8');

var ExplorerPanelViewModel = function(options) {
    this.isOpen = true;
    this.tabs = [];

    knockout.track(this, ['isOpen', 'tabs']);
};

/**
 * Shows this panel by adding it to the DOM inside a given container element.
 * @param {DOMNode} container The DOM node to which to add this panel.
 */
ExplorerPanelViewModel.prototype.show = function(container) {
    var fragment = createFragmentFromTemplate(html);
    var element = fragment.childNodes[0];
    container.appendChild(element);

    knockout.applyBindings(this, element);
};

ExplorerPanelViewModel.prototype.addTab = function(tabViewModel) {
    this.tabs.push(tabViewModel);

    tabViewModel.panel = this;

    if (this.tabs.length === 1) {
        this.activateTab(tabViewModel);
    }

    return tabViewModel;
};

ExplorerPanelViewModel.prototype.activateTab = function(tab) {
    for (var i = 0; i < this.tabs.length; ++i) {
        this.tabs[i].isActive = false;
    }

    tab.isActive = true;

    this.isOpen = true;
};

ExplorerPanelViewModel.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

module.exports = ExplorerPanelViewModel;