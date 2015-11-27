'use strict';

var React = window.React = require('react'),
    ReactDOM = require('react-dom'),
    ModalWindow = require('./ModalWindow.jsx'),
    SidePanel = require('./SidePanel.jsx'),
    TerriaViewer = require('./TerriaViewer.js'),
    CesiumEvent = require('terriajs-cesium/Source/Core/Event'),
    FeatureInfoPanel = require('./FeatureInfoPanel.jsx');


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

    //temp
    window.nowViewingUpdate = this.nowViewingUpdate;
    window.previewUpdate = this.previewUpdate;
    window.openModalWindow = this.openModalWindow;
    window.terria = this.terria;
}

UiWrapper.prototype.init = function(main, nav, aside) {
    var terria = this.terria;
        ReactDOM.render(<ModalWindow terria={terria} />, main);
        ReactDOM.render(<SidePanel terria={terria} />, nav);

        //temp
        var canvas = document.querySelector('canvas');

        canvas.addEventListener('click', function(){
          ReactDOM.render(<FeatureInfoPanel terria={terria} />, aside);
          });

        this.nowViewingUpdate.addEventListener(function(){
          ReactDOM.render(<SidePanel nowViewing={terria.nowViewing} />, nav);
          ReactDOM.render(<ModalWindow terria={terria} />, main);
        });

};

module.exports = UiWrapper;
