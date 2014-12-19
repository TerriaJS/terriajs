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

    this.svgClose = 'M 6.937799,8.0450206 1.6369862,13.186666 C 1.3832705,13.432763 0.97809202,13.426587 0.73199467,13.172871 0.48589732,12.919156 0.4920732,12.513977 0.74578889,12.26788 L 6.0185862,7.1534091 0.74578889,2.0389383 C 0.4920732,1.792841 0.48589732,1.3876625 0.73199467,1.1339468 0.97809202,0.88023108 1.3832705,0.8740552 1.6369862,1.1201525 l 5.3008128,5.141645 5.300813,-5.141645 c 0.253716,-0.2460973 0.658894,-0.23992142 0.904991,0.013794 0.246098,0.2537157 0.239922,0.6588942 -0.01379,0.9049915 L 7.8570118,7.1534091 13.129809,12.26788 c 0.253716,0.246097 0.259892,0.651276 0.01379,0.904991 -0.246097,0.253716 -0.651275,0.259892 -0.904991,0.0138 L 6.937799,8.0450206 z';
    this.svgMenu = 'm 1.0625,0.84375 a 0.80661934,0.80661934 0 0 0 0.25,1.59375 l 19.375,0 a 0.80008001,0.80008001 0 1 0 0,-1.59375 l -19.375,0 a 0.80008001,0.80008001 0 0 0 -0.15625,0 0.8006955,0.8006955 0 0 0 -0.09375,0 z M 1.125,7.1875 a 0.81789077,0.81789077 0 0 0 0.1875,1.625 l 19.375,0 a 0.8125,0.8125 0 0 0 0,-1.625 l -19.375,0 a 0.80008001,0.80008001 0 0 0 -0.09375,0 0.81385104,0.81385104 0 0 0 -0.09375,0 z m -0.0625,6.375 a 0.80661934,0.80661934 0 0 0 0.25,1.59375 l 19.375,0 a 0.80008001,0.80008001 0 1 0 0,-1.59375 l -19.375,0 a 0.80008001,0.80008001 0 0 0 -0.15625,0 0.8006955,0.8006955 0 0 0 -0.09375,0 z';
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