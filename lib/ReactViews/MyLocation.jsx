'use strict';
import React from 'react';
import ObserveModelMixin from './ObserveModelMixin';
import Rectangle from 'terriajs-cesium/Source/Core/Rectangle';
import GeoJsonCatalogItem from '../Models/GeoJsonCatalogItem';

const MyLocation = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired
    },

    getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.zoomToMyLocation);
        } else {
            console.log('geo location is not supported');
        }
    },

    zoomToMyLocation(position) {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        // west, south, east, north, result
        const rectangle = Rectangle.fromDegrees(longitude - 0.1, latitude - 0.1, longitude + 0.1, latitude + 0.1);
        this.props.terria.currentViewer.zoomTo(rectangle);

        const marker = new GeoJsonCatalogItem(this.props.terria);
        marker.name = 'Location';
        marker.data = {
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
        marker.style = {
            'marker-size': 25,
            'marker-color': '#08ABD5',
            'stroke': '#ffffff',
            'stroke-width': 3
        };
        marker.isEnabled = true;
    },

    handleCick() {
        this.getLocation();
    },
    render() {
        return <div className='my-location'>
                  <button className='btn btn--my-location btn--geolocation'
                          title='go to my location'
                          onClick={this.handleCick}></button>
               </div>;
    }
});
module.exports = MyLocation;
