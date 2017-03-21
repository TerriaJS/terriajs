'use strict';
import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';
import Rectangle from 'terriajs-cesium/Source/Core/Rectangle';
import Styles from './my_location.scss';
import TerriaError from '../../../Core/TerriaError';
import CesiumCartographic from 'terriajs-cesium/Source/Core/Cartographic.js';
import Icon from "../../Icon.jsx";
import defined from 'terriajs-cesium/Source/Core/defined';

const GeoJsonCatalogItem = require('../../../Models/GeoJsonCatalogItem');

const MyLocation = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired
    },

    _marker: undefined,

    componentWillMount() {
        this._marker = new GeoJsonCatalogItem(this.props.terria);
    },

    getLocation() {
        if(navigator.geolocation) {
            const options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };
            navigator.geolocation.getCurrentPosition(
                this.zoomToMyLocation,
                (err)=>{
                    this.props.terria.error.raiseEvent(new TerriaError({
                        sender: this,
                        title: 'Error getting location',
                        message: err.message
                    }));
                },
                options
            );
        } else {
            this.props.terria.error.raiseEvent(new TerriaError({
                sender: this,
                title: 'Error getting location',
                message: 'Your browser does not support location.'
            }));
        }
    },

    zoomToMyLocation(position) {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;

        if (defined(this.props.terria.augmentedVirtuality) &&
            this.props.terria.augmentedVirtuality.enabled) {

            // Note: Specifiying the value of 27500m here enables this function to approximately mimic the behaviour of
            //       the else case from the cameras inital view and when the viewer pan/zooms out to much.
            this.props.terria.augmentedVirtuality.moveTo(CesiumCartographic.fromDegrees(longitude, latitude), 27500);
        } else {
            // west, south, east, north, result
            const rectangle = Rectangle.fromDegrees(longitude - 0.1, latitude - 0.1, longitude + 0.1, latitude + 0.1);
            this.props.terria.currentViewer.zoomTo(rectangle);
        }

        this._marker.name = 'My Location';
        this._marker.data = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            properties: {
                title: 'Location',
                longitude: longitude,
                latitude: latitude
            }
        };
        this._marker.style = {
            'marker-size': 25,
            'marker-color': '#08ABD5',
            'stroke': '#ffffff',
            'stroke-width': 3
        };
        this._marker.isEnabled = true;
    },

    handleCick() {
        this.getLocation();
    },
    render() {
        return <div className={Styles.myLocation}>
                  <button type='button' className={Styles.btn}
                          title='go to my location'
                          onClick={this.handleCick}>
                          <Icon glyph={Icon.GLYPHS.geolocation}/>
                  </button>
               </div>;
    }
});

export default MyLocation;
