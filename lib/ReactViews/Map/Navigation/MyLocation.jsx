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

    getInitialState() {
        return {};
    },

    getLocation() {
        if (navigator.geolocation) {
            const options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };
            let error = err => {
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
            };
            if (!this.augmentedVirtualityAvaliable()) {
                navigator.geolocation.getCurrentPosition(
                    this.zoomToMyLocation,
                    error,
                    options
                );
            } else {
                const watchId = navigator.geolocation.watchPosition(
                    this.zoomToMyLocation,
                    error,
                    options
                );

                this.setState({watchId: watchId});
            }
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

        if (this.augmentedVirtualityAvaliable()) {
            // Note: Specifiying the value of 27500m here enables this function to approximately mimic the behaviour of
            //       the else case from the cameras inital view and when the viewer pan/zooms out to much.
            // TODO: After the first update just jump to rather then moving to.
            this.props.terria.augmentedVirtuality.moveTo(CesiumCartographic.fromDegrees(longitude, latitude), 27500, !defined(this.state.flown));
            this.setState({flown: true});
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

    augmentedVirtualityAvaliable() {
        return defined(this.props.terria.augmentedVirtuality) && this.props.terria.augmentedVirtuality.enabled;
    },

    followMeEnabled() {
        if (defined(this.state.watchId)) {
            return true;
        }

        return false;
    },

    disableFollowMe() {
        if (defined(this.state.watchId)) {
            navigator.geolocation.clearWatch(this.state.watchId);
            this.setState({watchId: undefined});
            this.setState({flown: undefined});
        }
    },

    handleCick() {
        if (this.followMeEnabled()) {
            this.disableFollowMe();
        }
        else {
            this.getLocation();
        }
    },

    render() {
        let revertStub = Icon.GLYPHS.geolocation;
        if (this.followMeEnabled()) {
            revertStub = Icon.GLYPHS.stop;
        }

        return <div className={Styles.myLocation}>
                  <button type='button' className={Styles.btn}
                          title='go to my location'
                          onClick={this.handleCick}>
                          <Icon glyph={revertStub}/>
                  </button>
               </div>;
    }
});

export default MyLocation;
