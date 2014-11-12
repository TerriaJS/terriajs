"use strict";

/*global require,ga*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var createCommand = require('../../third_party/cesium/Source/Widgets/createCommand');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

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

