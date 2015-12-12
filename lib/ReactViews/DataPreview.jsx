'use strict';

var React = require('react');
var markdownToHtml = require('terriajs/lib/Core/markdownToHtml');
var Terria = require('../Models/Terria');
var TerriaViewer = require('./TerriaViewer.js');
var ViewerMode = require('../Models/ViewerMode');
var CameraView = require('../Models/CameraView');


var DataPreview = React.createClass({
    propTypes: {
        previewed: React.PropTypes.object,
        terria: React.PropTypes.object
    },

    getDefaultProps: function() {
        return {
            previewed: {
                name: 'Select a Dataset to see preview',
                description: ''
            }
        };
    },

    componentWillMount: function(){
        var terria = this.props.terria;

        this.terriaPreview = new Terria({
            appName: terria.appName,
            supportEmail: terria.supportEmail,
            baseUrl: terria.baseUrl,
            cesiumBaseUrl: terria.cesiumBaseUrl
        });

        this.terriaPreview.viewerMode = ViewerMode.Leaflet;
        this.terriaPreview.homeView = terria.homeView;
        this.terriaPreview.initialView = new CameraView(terria.currentViewer.getCurrentExtent());
        this.terriaPreview.regionMappingDefinitionsUrl = terria.regionMappingDefinitionsUrl;

        // TerriaViewer.create(this.terriaForRegionSelection, {
        //     mapContainer: mapContainer,
        //     uiContainer: uiContainer
        // });
    },

    shouldComponentUpdate: function(){
        return false;
    },

    toggleOnMap: function() {
        this.props.previewed.isEnabled = !this.props.previewed.isEnabled;
        window.nowViewingUpdate.raiseEvent();
    },

    render: function() {
        var previewed = this.props.previewed;
        var that = this;
        return (<figure>
                <div className='terria-preview' ref={function(previewContainer) {
                  if (previewContainer !== null) {
                    var t = TerriaViewer.create(that.terriaPreview, {
                            mapContainer: previewContainer
                    });
                    console.log(t);
                  }
              }}>
                </div>
                <figcaption>
                <div className="title clearfix">
                <h4 className="col col-7">{previewed.name}</h4>
                <ul className="list-reset flex col col-5 data-preview-action">
                <li><button className="btn" title ="share this data"><i className="icon icon-share"></i></button></li>
                <li><button onClick={this.toggleOnMap} className={'btn ' + (previewed.isEnabled ? 'btn-preview-remove-from-map' : 'btn-preview-add-to-map')} title ={previewed.isEnabled ? 'remove from map' : 'add to map'}><i className="icon icon-plus"></i>{previewed.isEnabled ? 'Remove from map' : 'Add to map'}</button></li>
                </ul>
                </div>
                <p dangerouslySetInnerHTML={{__html: markdownToHtml(previewed.description)}}></p>
                </figcaption>
                </figure>);
    }
});
module.exports = DataPreview;
