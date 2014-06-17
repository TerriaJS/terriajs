"use strict";

/*global Cesium,require*/

var defineProperties = Cesium.defineProperties;
var getElement = Cesium.getElement;

var knockout = require('knockout');
var knockoutES5 = require('../../public/third_party/knockout-es5.js');

var GeoDataBrowserViewModel = require('./GeoDataBrowserViewModel');

var GeoDataBrowser = function(options) {
    var container = getElement(options.container);

    this._viewModel = new GeoDataBrowserViewModel({
        viewer : options.viewer,
        dataManager : options.dataManager,
        map : options.map
    });

    var wrapper = document.createElement('div');
    container.appendChild(wrapper);

    var dataButton = document.createElement('div');
    dataButton.className = 'ausglobe-panel-button';
    dataButton.innerHTML = '<img class="ausglobe-panel-button-image" src="images/data.svg" /> <span class="ausglobe-panel-button-label">Data</span>';
    dataButton.setAttribute('data-bind', 'click: toggleShowingPanel, css { "ausglobe-panel-button-panel-visible": showingPanel }');
    wrapper.appendChild(dataButton);

    var mapButton = document.createElement('div');
    mapButton.className = 'ausglobe-panel-button';
    mapButton.innerHTML = '<img class="ausglobe-panel-button-image" src="images/map.png" /> <span class="ausglobe-panel-button-label">Map</span>';
    mapButton.setAttribute('data-bind', 'click: toggleShowingMapPanel, css { "ausglobe-panel-button-panel-visible": showingMapPanel }');
    wrapper.appendChild(mapButton);

    var dataPanel = document.createElement('div');
    dataPanel.className = 'ausglobe-panel';
    dataPanel.setAttribute('data-bind', 'css: { "ausglobe-panel-visible" : showingPanel }');

    dataPanel.innerHTML = '\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openNowViewing">\
                <div class="ausglobe-accordion-item-header-label">Now Viewing</div>\
                <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_up.svg" data-bind="visible: nowViewingIsOpen" />\
                <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_down.svg" data-bind="visible: !nowViewingIsOpen" />\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': nowViewingIsOpen }">\
                <div class="ausglobe-accordion-category">\
                    <div class="ausglobe-accordion-category-content ausglobe-accordion-category-content-visible" data-bind="foreach: nowViewing">\
                        <div class="ausglobe-accordion-category-item" data-bind="css: { \'ausglobe-accordion-category-item-enabled\': show }">\
                            <img class="ausglobe-accordion-category-item-checkbox" src="images/Check_tick.svg" data-bind="click: $root.toggleItemShown, visible: show" />\
                            <img class="ausglobe-accordion-category-item-checkbox" src="images/Check_box.svg" data-bind="click: $root.toggleItemShown, visible: !show()" />\
                            <div class="ausglobe-accordion-category-item-label" data-bind="text: Title, click: $root.zoomToItem"></div>\
                            <div class="ausglobe-accordion-category-item-infoButton" data-bind="click: $root.showInfoForItem">info</div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>\
        <div data-bind="foreach: content">\
            <div class="ausglobe-accordion-item">\
                <div class="ausglobe-accordion-item-header" data-bind="click: $root.openItem">\
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
                        <div class="ausglobe-accordion-category-loading" data-bind="visible: isLoading">Loading</div>\
                        <div class="ausglobe-accordion-category-content" data-bind="foreach: Layer, css: { \'ausglobe-accordion-category-content-visible\': isOpen }">\
                            <div class="ausglobe-accordion-category-item" data-bind="css: { \'ausglobe-accordion-category-item-enabled\': isEnabled() }">\
                                <img class="ausglobe-accordion-category-item-checkbox" src="images/Check_tick.svg" data-bind="click: $root.toggleItemEnabled, visible: isEnabled()" />\
                                <img class="ausglobe-accordion-category-item-checkbox" src="images/Check_box.svg" data-bind="click: $root.toggleItemEnabled, visible: !isEnabled()" />\
                                <div class="ausglobe-accordion-category-item-label" data-bind="text: Title, click: $root.zoomToItem"></div>\
                                <div class="ausglobe-accordion-category-item-infoButton" data-bind="click: $root.showInfoForItem">info</div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openAddData">\
                <div class="ausglobe-accordion-item-header-label">Add Data</div>\
                <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_up.svg" data-bind="visible: addDataIsOpen" />\
                <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_down.svg" data-bind="visible: !addDataIsOpen" />\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': addDataIsOpen }">\
                <div data-bind="foreach: userContent">\
                    <div class="ausglobe-accordion-category">\
                        <div class="ausglobe-accordion-category-header" data-bind="click: $root.toggleCategoryOpen">\
                            <img class="ausglobe-accordion-category-header-arrow" src="images/full_arrow_up.svg" data-bind="visible: isOpen()" />\
                            <img class="ausglobe-accordion-category-header-arrow" src="images/full_arrow_down.svg" data-bind="visible: !isOpen()" />\
                            <div class="ausglobe-accordion-category-header-label" data-bind="text: name"></div>\
                        </div>\
                        <div class="ausglobe-accordion-category-loading" data-bind="visible: isLoading">Loading</div>\
                        <div class="ausglobe-accordion-category-content" data-bind="foreach: Layer, css: { \'ausglobe-accordion-category-content-visible\': isOpen }">\
                            <div class="ausglobe-accordion-category-item" data-bind="css: { \'ausglobe-accordion-category-item-enabled\': isEnabled() }">\
                                <img class="ausglobe-accordion-category-item-checkbox" src="images/Check_tick.svg" data-bind="click: $root.toggleItemEnabled, visible: isEnabled()" />\
                                <img class="ausglobe-accordion-category-item-checkbox" src="images/Check_box.svg" data-bind="click: $root.toggleItemEnabled, visible: !isEnabled()" />\
                                <div class="ausglobe-accordion-category-item-label" data-bind="text: Title, click: $root.zoomToItem"></div>\
                                <div class="ausglobe-accordion-category-item-infoButton" data-bind="click: $root.showInfoForItem">info</div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
                <div class="ausglobe-accordion-category">\
                    <div>\
                        Add data by dragging and dropping it onto the map, or\
                        <span class="ausglobe-upload-file-button" data-bind="click: selectFileToUpload">Browse and select a file to upload</span>.\
                        <input type="file" style="display: none;" id="uploadFile" data-bind="event: { change: addUploadedFile }"/>\
                    </div>\
                    <form class="ausglobe-user-service-form" data-bind="submit: addWfsService">\
                        <label>\
                            <div>Add a Web Feature Service URL (advanced):</div>\
                            <input class="ausglobe-wfs-url-input" type="text" data-bind="value: wfsServiceUrl" />\
                        </label>\
                        <div>\
                            <input class="ausglobe-button" type="submit" value="Add" />\
                        </div>\
                    </form>\
                </div>\
            </div>\
        </div>';

    wrapper.appendChild(dataPanel);

    var mapPanel = document.createElement('div');
    mapPanel.className = 'ausglobe-panel';
    mapPanel.setAttribute('data-bind', 'css: { "ausglobe-panel-visible" : showingMapPanel }');

    mapPanel.innerHTML = '\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openImagery">\
                <div class="ausglobe-accordion-item-header-label">Imagery</div>\
                <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_up.svg" data-bind="visible: imageryIsOpen" />\
                <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_down.svg" data-bind="visible: !imageryIsOpen" />\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': imageryIsOpen }">\
                <img class="ausglobe-imagery-option" src="images/AustralianTopography.png" width="73" height="74" data-bind="click: activateAustralianTopography" />\
                <img class="ausglobe-imagery-option" src="images/BingMapsAerialWithLabels.png" width="73" height="74" data-bind="click: activateBingMapsAerialWithLabels" />\
                <img class="ausglobe-imagery-option" src="images/BingMapsAerial.png" width="73" height="74" data-bind="click: activateBingMapsAerial" />\
                <img class="ausglobe-imagery-option" src="images/BingMapsRoads.png" width="73" height="74" data-bind="click: activateBingMapsRoads" />\
                <img class="ausglobe-imagery-option" src="images/NASABlackMarble.png" width="73" height="74" data-bind="click: activateNasaBlackMarble" />\
                <img class="ausglobe-imagery-option" src="images/NaturalEarthII.png" width="73" height="74" data-bind="click: activateNaturalEarthII" />\
            </div>\
        </div>\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openViewerSelection">\
                <div class="ausglobe-accordion-item-header-label">2D/3D</div>\
                <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_up.svg" data-bind="visible: viewerSelectionIsOpen" />\
                <img class="ausglobe-accordion-item-header-arrow" src="images/open_arrow_down.svg" data-bind="visible: !viewerSelectionIsOpen" />\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': viewerSelectionIsOpen }">\
                <label class="ausglobe-viewer-radio-button"><input type="radio" name="viewer" value="2D" data-bind="checked: selectedViewer" /> 2D</label>\
                <label class="ausglobe-viewer-radio-button"><input type="radio" name="viewer" value="Ellipsoid" data-bind="checked: selectedViewer" /> 3D Smooth Globe</label>\
                <label class="ausglobe-viewer-radio-button"><input type="radio" name="viewer" value="Terrain" data-bind="checked: selectedViewer" /> 3D Terrain</label>\
            </div>\
        </div>';

    wrapper.appendChild(mapPanel);

    knockout.applyBindings(this._viewModel, wrapper);
};

defineProperties(GeoDataBrowser.prototype, {
    viewModel : {
        get : function() {
            return this._viewModel;
        }
    }
});

module.exports = GeoDataBrowser;
