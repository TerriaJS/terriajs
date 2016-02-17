'use strict';
import React from 'react';
import ObserveModelMixin from './ObserveModelMixin';
import Rectangle from 'terriajs-cesium/Source/Core/Rectangle';

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
        const rectangle = Rectangle.fromDegrees(longitude - 0.1, latitude + 0.1, longitude + 0.1, latitude + 0.1);
        this.props.terria.currentViewer.zoomTo(rectangle);
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
