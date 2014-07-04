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
    wrapper.innerHTML = '\
        <div class="ausglobe-title-image"><img src="images/Australia.png" width="60" height="46" /></div>\
        <div class="ausglobe-title-image"><img src="images/nicta.png" width="60" height="60" /></div>\
        <div class="ausglobe-title-image"><img src="images/nationalmap.png" width="99" height="40" /></div>\
        <div id="ausglobe-title-middle" class="ausglobe-title-middle"></div>\
        <div class="ausglobe-title-credits"></div>\
        <div class="ausglobe-title-menu" data-bind="foreach: menuItems">\
            <span data-bind="if: typeof svg !== \'undefined\'"><a class="ausglobe-title-menuItem" data-bind="cesiumSvgPath: { path: svg.path, width: svg.width, height: svg.height }, attr: { href: uri, target: target, title: tooltip }, click: $parent.selectMenuItem"></a></span>\
            <span data-bind="if: typeof label !== \'undefined\'"><a class="ausglobe-title-menuItem" data-bind="html: label, attr: { href: uri, target: target, title: tooltip }, click: $parent.selectMenuItem"></a></span>\
        </div>';
    container.appendChild(wrapper);

    this._middeContainer = document.getElementById('ausglobe-title-middle');

    knockout.applyBindings(viewModel, wrapper);
};

defineProperties(TitleWidget.prototype, {
    middleContainer : {
        get : function() {
            return this._middleContainer;
        }
    }
});

module.exports = TitleWidget;
