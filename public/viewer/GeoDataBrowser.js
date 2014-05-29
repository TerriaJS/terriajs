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
                    <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_up.svg" data-bind="visible: $root.openIndex === $index()" />\
                    <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_down.svg" data-bind="visible: $root.openIndex !== $index()" />\
                </div>\
                <div class="ausglobe-accordion-item-content" data-bind="foreach: Layer, css: { \'ausglobe-accordion-item-content-visible\': $parent.openIndex === $index() }">\
                    <div class="ausglobe-accordion-category">\
                        <div class="ausglobe-accordion-category-header" data-bind="click: $root.toggleCategoryOpen">\
                            <img class="ausglobe-accordion-category-header-arrow" src="images/full_arrow_up.svg" data-bind="visible: isOpen()" />\
                            <img class="ausglobe-accordion-category-header-arrow" src="images/full_arrow_down.svg" data-bind="visible: !isOpen()" />\
                            <div class="ausglobe-accordion-category-header-label" data-bind="text: name"></div>\
                        </div>\
                        <div class="ausglobe-accordion-category-content" data-bind="foreach: Layer, css: { \'ausglobe-accordion-category-content-visible\': isOpen }">\
                            <div class="ausglobe-accordion-category-item" data-bind="css: { \'ausglobe-accordion-category-item-enabled\': isEnabled() }">\
                                <img class="ausglobe-accordion-category-item-checkbox" src="images/Check_tick.svg" data-bind="click: $root.toggleItemEnabled, visible: isEnabled()" />\
                                <img class="ausglobe-accordion-category-item-checkbox" src="images/Check_box.svg" data-bind="click: $root.toggleItemEnabled, visible: !isEnabled()" />\
                                <div class="ausglobe-accordion-category-item-label" data-bind="text: Title"></div>\
                                <div class="ausglobe-accordion-category-item-infoButton">info</div>\
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
