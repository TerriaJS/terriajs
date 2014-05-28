/*global define*/
define([
    'Cesium/Core/defined',
    'Cesium/Core/defineProperties',
    'Cesium/Widgets/createCommand',
    'ui/TitleWidgetViewModel',
    'knockout'
], function(
    defined,
    defineProperties,
    createCommand,
    TitleWidgetViewModel,
    knockout) {
    "use strict";

    var TitleWidgetViewModel = function(options) {
        this.title = 'National Map';
        this.menuItems = options.menuItems.map(function(item) {
            return {
                label : item.label,
                uri : item.uri,
                target : item.target,
                callback : item.callback
            };
        });

        var that = this;
        this._selectMenuItem = createCommand(function(menuItem) {
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

    return TitleWidgetViewModel;
});
