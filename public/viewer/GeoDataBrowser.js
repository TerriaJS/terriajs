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

        this._viewModel = new GeoDataBrowserViewModel(options.content);

        var wrapper = document.createElement('div');
        container.appendChild(wrapper);

        var dataPanel = document.createElement('div');
        dataPanel.className = 'ausglobe-panel';
        dataPanel.setAttribute('data-bind', 'css: { "ausglobe-panel-visible" : showingPanel }, foreach: content');

        dataPanel.innerHTML = '\
            <div class="ausglobe-accordion-item">\
                <div class="ausglobe-accordion-item-header" data-bind="click: $parent.openItem">\
                    <div class="ausglobe-accordion-item-header-label" data-bind="text: name"></div>\
                </div>\
                <div class="ausglobe-accordion-item-content" data-bind="foreach: Layer, css: { \'ausglobe-accordion-item-content-visible\': $parent.openIndex === $index() }">\
                    <div class="ausglobe-accordion-category">\
                        <div class="ausglobe-accordion-category-header">\
                            <div class="ausglobe-accordion-category-header-label" data-bind="text: name"></div>\
                        </div>\
                        <div class="ausglobe-accordion-category-content" data-bind="foreach: Layer">\
                            <div class="ausglobe-accordion-category-item">\
                                <div class="ausglobe-accordion-category-item-label" data-bind="text: Name"></div>\
                            </div>\
                        </div>\
                    </div>\
                </div>';

        wrapper.appendChild(dataPanel);

        var dataButton = document.createElement('div');
        dataButton.className = 'ausglobe-panel-button';
        dataButton.innerHTML = '<img class="ausglobe-panel-button-image" src="images/data.svg" /> <span class="ausglobe-panel-button-label">Data</span>';
        dataButton.setAttribute('data-bind', 'click: toggleShowingPanel, css { "ausglobe-panel-button-panel-visible": showingPanel }');
        wrapper.appendChild(dataButton);

        knockout.applyBindings(this._viewModel, wrapper);
    };

    return GeoDataBrowser;
});
