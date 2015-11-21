var React = window.React = require('react'),
    ReactDOM = require('react-dom'),
    ModalWindow = require('terriajs/lib/ReactViews/ModalWindow.jsx'),
    SidePanel = require('terriajs/lib/ReactViews/SidePanel.jsx'),
    TerriaViewer = require('terriajs/lib/ReactViews/TerriaViewer.js'),
    CesiumEvent = require('terriajs-cesium/Source/Core/Event'),
    EventEmitter = require('terriajs/lib/ReactViews/EventEmitter.js');
var emitter = new EventEmitter();
window.emitter = emitter;

var UiWrapper = function (terria) {
    /**
     * Gets or sets an event that is raised when the nowViewing is updated.
     * @type {CesiumEvent}
     */
    this.nowViewingUpdate = new CesiumEvent();

    /**
     * Gets or sets an event that is raised when the preview is updated.
     * @type {CesiumEvent}
     */
    this.previewUpdate = new CesiumEvent();

    this.openModalWindow = new CesiumEvent();

    this.terria = terria;

    window.nowViewingUpdate = this.nowViewingUpdate;
    window.previewUpdate = this.previewUpdate;
    window.openModalWindow = this.openModalWindow;
}

UiWrapper.prototype.init = function(main, nav) {
    var terria = this.terria;
        ReactDOM.render(<ModalWindow catalog={terria.catalog.group.items} />, main);
        ReactDOM.render(<SidePanel terria={terria} />, nav);

        this.nowViewingUpdate.addEventListener(function(){
          ReactDOM.render(<SidePanel events={this.nowViewingUpdate} terria={terria} />, nav);
        });
};

module.exports = UiWrapper;
