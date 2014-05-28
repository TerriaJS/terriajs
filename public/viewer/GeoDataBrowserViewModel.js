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
        this.showingPanel = false;

        var that = this;
        this._toggleShowingPanel = createCommand(function() {
            that.showingPanel = !that.showingPanel;
        });

        knockout.track(this, ['showingPanel']);
    };

    defineProperties(GeoDataBrowserViewModel.prototype, {
        toggleShowingPanel : {
            get : function() {
                return this._toggleShowingPanel;
            }
        }
    });

    return GeoDataBrowserViewModel;
});
