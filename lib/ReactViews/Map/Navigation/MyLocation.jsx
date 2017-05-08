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
            if (!this.augmentedVirtualityEnabled()) {
                // When Augmented Virtuality is not enabled then just get a single position update.
                navigator.geolocation.getCurrentPosition(
                    this.zoomToMyLocation,
                    this.handleLocationError,
                    options
                );
            } else {
                // When Augmented Virtuality is enabled then we effectively toggle into watch mode and the position is repeatedly updated.
                const watchId = navigator.geolocation.watchPosition(
                    this.zoomToMyLocation,
                    this.handleLocationError,
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

        if (this.augmentedVirtualityEnabled()) {
            // Note: Specifiying the value of 27500m here enables this function to approximately mimic the behaviour of
            //       the else case from the cameras inital view and when the viewer pan/zooms out to much.
            // We use the flag variable flown so that the user is flown to the current location when this function is
            // first fired, but subsuquently the updates are jump location moves, since we assume that the movements are
            // small and flyTo performs badly when the increments are small (slow and unresponsive).
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

        if (this._marker.isEnabled !== true) {
            this._marker.isEnabled = true;
        }

        if (this._marker.isShown) {
            // Toggle the state of .isShown()  to force the marker to visually update.
            // Despite .data being one of the ._getValuesThatInfluenceLoad() it does not seem sufficent to update the data value to get the element to reload so this hack is in place to get the element to visually update.
            // Force the exiting source to be removed from the list.
            this._marker.isShown = false;
            // Reload the data and then reshow the element when done loading.
            this._marker.load().then(() => { this._marker.isShown = true });
        }
    },

    handleLocationError(err) {
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

    augmentedVirtualityEnabled() {
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
        } else {
            this.getLocation();
        }
    },

    render() {
        let toggleStyle = Styles.btn;
        if (this.followMeEnabled()) {
            toggleStyle = Styles.btnPrimary;
        }

        return <div className={Styles.myLocation}>
                  <button type='button' className={toggleStyle}
                          title='go to my location'
                          onClick={this.handleCick}>
                          <Icon glyph={Icon.GLYPHS.geolocation}/>
                  </button>
               </div>;
    }
});

export default MyLocation;
