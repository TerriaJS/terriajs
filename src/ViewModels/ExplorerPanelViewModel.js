'use strict';

/*global require*/
var fs = require('fs');

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var createFragmentFromTemplate = require('../Core/createFragmentFromTemplate');

var html = fs.readFileSync(__dirname + '/../Views/ExplorerPanel.html', 'utf8');

var ExplorerPanelViewModel = function(options) {
    this.isVisible = true;
    this.items = [];

    knockout.track(this, ['isVisible', 'items']);
};

ExplorerPanelViewModel.create = function(container, options) {
    container = defaultValue(container, document.body);

    var fragment = createFragmentFromTemplate(html);
    var element = fragment.childNodes[0];
    container.appendChild(element);

    var viewModel = new ExplorerPanelViewModel(options);
    knockout.applyBindings(viewModel, element);

    return viewModel;
};

ExplorerPanelViewModel.prototype.addTab = function(tabViewModel) {
    this.items.push(tabViewModel);

    tabViewModel.panel = this;

    if (this.items.length === 1) {
        this.activateTab(tabViewModel);
    }

    return tabViewModel;
};

ExplorerPanelViewModel.prototype.activateTab = function(tab) {
    for (var i = 0; i < this.items.length; ++i) {
        this.items[i].isActive = false;
    }

    tab.isActive = true;
};

module.exports = ExplorerPanelViewModel;