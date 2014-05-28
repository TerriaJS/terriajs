define([
        'Cesium/Widgets/getElement',
        'knockout',
        'ui/GeoDataBrowserViewModel'
    ], function(
        getElement,
        knockout,
        GeoDataBrowserViewModel) {
    "use strict";

    var GeoDataBrowser = function(options) {
        var container = getElement(options.container);

        var viewModel = new GeoDataBrowserViewModel({
        });

        var wrapper = document.createElement('div');
        container.appendChild(wrapper);

        var dataPanel = document.createElement('div');
        dataPanel.className = 'ausglobe-panel';
        dataPanel.setAttribute('data-bind', 'css: { "ausglobe-panel-visible" : showingPanel }');
        wrapper.appendChild(dataPanel);

        var dataButton = document.createElement('div');
        dataButton.className = 'ausglobe-panel-button';
        dataButton.innerHTML = '<img class="ausglobe-panel-button-image" src="images/data.svg" /> <span class="ausglobe-panel-button-label">Data</span>';
        dataButton.setAttribute('data-bind', 'click: toggleShowingPanel, css { "ausglobe-panel-button-panel-visible": showingPanel }');
        wrapper.appendChild(dataButton);

        knockout.applyBindings(viewModel, wrapper);
    };

    return GeoDataBrowser;
});
