"use strict";

/*global require,ga*/

var defined = require('../../public/cesium/Source/Core/defined');
var defineProperties = require('../../public/cesium/Source/Core/defineProperties');
var createCommand = require('../../public/cesium/Source/Widgets/createCommand');

var knockout = require('knockout');

var TitleWidgetViewModel = function(options) {
    this.title = 'National Map (BETA)';
    this.menuItems = options.menuItems.map(function(item) {
        return {
            label : item.label,
            svg : item.svg,
            tooltip : item.tooltip,
            uri : item.uri,
            target : item.target,
            callback : item.callback
        };
    });

    var that = this;
    this._selectMenuItem = createCommand(function(menuItem) {
        ga('send', 'event', 'titleMenu', 'click', menuItem.tooltip);
        if (defined(menuItem.callback)) {
            return menuItem.callback();
        }
        return true;
    });

    knockout.track(this, ['title', 'menuItems']);
};

defineProperties(TitleWidgetViewModel.prototype, {
    selectMenuItem : {
        get : function() {
            return this._selectMenuItem;
        }
    }
});

module.exports = TitleWidgetViewModel;

