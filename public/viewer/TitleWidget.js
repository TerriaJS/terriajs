(function() {
    /**
     *
     * @param options.container
     * @constructor
     */
    var TitleWidget = function(options) {
        var container = Cesium.getElement(options.container);
        var viewModel = new Cesium.TitleWidgetViewModel();

        var wrapper = document.createElement('div');
        wrapper.className = 'cesium-title-wrapper';
        container.appendChild(wrapper);

        var title = document.createElement('div');
        title.className = 'cesium-title-text';
        title.setAttribute('data-bind', 'text : title');
        wrapper.appendChild(title);
    };

    Cesium.TitleWidget = TitleWidget;
})();
