(function() {
    var TitleWidgetViewModel = function() {
        this.title = 'National Map';

        Cesium.knockout.track(this, ['title']);
    };

    Cesium.TitleWidgetViewModel = TitleWidgetViewModel;
})();
