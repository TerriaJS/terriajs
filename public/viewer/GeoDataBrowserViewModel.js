define([
        'Cesium/Core/defineProperties',
        'Cesium/Widgets/createCommand',
        'knockout'
    ], function(
        defineProperties,
        createCommand,
        knockout) {
    "use strict";

    var GeoDataBrowserViewModel = function(contentViewModel) {
        this.content = contentViewModel;

        this.showingPanel = false;
        this.openIndex = 0;

        var that = this;
        this._toggleShowingPanel = createCommand(function() {
            that.showingPanel = !that.showingPanel;
        });

        this._openItem = createCommand(function(item) {
            that.openIndex = that.content.indexOf(item);
        });

        this._toggleCategoryOpen = createCommand(function(item) {
            item.isOpen(!item.isOpen());
        });

        knockout.track(this, ['showingPanel', 'openIndex']);
    };

    defineProperties(GeoDataBrowserViewModel.prototype, {
        toggleShowingPanel : {
            get : function() {
                return this._toggleShowingPanel;
            }
        },

        openItem : {
            get : function() {
                return this._openItem;
            }
        },

        toggleCategoryOpen : {
            get : function() {
                return this._toggleCategoryOpen;
            }
        }
    });

    return GeoDataBrowserViewModel;
});
