'use strict';

import React from 'react';
import URI from 'urijs';

import Rectangle from 'terriajs-cesium/Source/Core/Rectangle';

import GeoJsonCatalogItem from '../../../Models/GeoJsonCatalogItem';
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './my_location.scss';
import TerriaError from '../../../Core/TerriaError';
import CesiumCartographic from 'terriajs-cesium/Source/Core/Cartographic.js';
import Icon from "../../Icon.jsx";
import defined from 'terriajs-cesium/Source/Core/defined';

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
        if (navigator.geolocation) {
            const options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };
            navigator.geolocation.getCurrentPosition(
                this.zoomToMyLocation,
                err => {
                    let message = err.message;
                    if (message && message.indexOf('Only secure origins are allowed') === 0) {
                        // This is actually the recommended way to check for this error.
                        // https://developers.google.com/web/updates/2016/04/geolocation-on-secure-contexts-only
                        const uri = new URI(window.location);
                        const secureUrl = uri.protocol('https').toString();
                        message = 'Your browser can only provide your location when using https. You may be able to use ' + secureUrl + ' instead.';
                    }
                    this.props.terria.error.raiseEvent(new TerriaError({
                        sender: this,
                        title: 'Error getting location',
                        message: message
                    }));
                },
                options
            );
        } else {
            this.props.terria.error.raiseEvent(new TerriaError({
                sender: this,
                title: 'Error getting location',
                message: 'Your browser cannot provide your location.'
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
        this._marker.isEnabled = false; // Force toggling isEnabled so that the marker location will visually update after the first call.
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
