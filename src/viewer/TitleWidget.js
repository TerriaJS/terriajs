"use strict";

/*global require,Cesium*/
var defineProperties = Cesium.defineProperties;
var getElement = Cesium.getElement;
var knockout = Cesium.knockout;

var TitleWidgetViewModel = require('./TitleWidgetViewModel');

/**
 *
 * @param options.container
 * @constructor
 */
var TitleWidget = function(options) {
    var container = getElement(options.container);
    var viewModel = new TitleWidgetViewModel({
        menuItems : options.menuItems
    });

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-title-area';
    container.appendChild(wrapper);

    var title = document.createElement('div');
    title.className = 'ausglobe-title-text';
    title.setAttribute('data-bind', 'text : title');
    wrapper.appendChild(title);

    this._creditContainer = document.createElement('div');
    this._creditContainer.className = 'ausglobe-title-credits';
    wrapper.appendChild(this._creditContainer);

    var titleMenu = document.createElement('div');
    titleMenu.className = 'ausglobe-title-menu';
    titleMenu.setAttribute('data-bind', 'foreach: menuItems');
    wrapper.appendChild(titleMenu);

    var menuItemDivider = document.createElement('div');
    menuItemDivider.className = 'ausglobe-title-menuItem-divider';
    menuItemDivider.setAttribute('data-bind', 'visible: $index() > 0');
    menuItemDivider.innerText = '|';
    titleMenu.appendChild(menuItemDivider);

    var menuItem = document.createElement('a');
    menuItem.className = 'ausglobe-title-menuItem';
    menuItem.setAttribute('data-bind', 'text: label, attr: { href: uri, target: target }, click: $parent.selectMenuItem');
    titleMenu.appendChild(menuItem);

    knockout.applyBindings(viewModel, wrapper);
};

defineProperties(TitleWidget.prototype, {
    creditContainer : {
        get : function() {
            return this._creditContainer;
        }
    }
});

module.exports = TitleWidget;
