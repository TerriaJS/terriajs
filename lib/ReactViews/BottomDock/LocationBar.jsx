'use strict';
import ObserveModelMixin from './../ObserveModelMixin';
import React from 'react';

const LocationBar = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        showUtmZone: React.PropTypes.bool,
        mouseCoords: React.PropTypes.object.isRequired
    },

    getDefaultProps: function() {
        return {
            showUtmZone: true
        };
    },

    toggleUseProjection() {
        this.props.mouseCoords.toggleUseProjection();
    },

    renderLatitudeLongitude() {
        if (!this.props.mouseCoords.useProjection) {
            return (<li className="location-bar--long-lat">
                <div className='lat'><span>Lat</span><span>{this.props.mouseCoords.latitude}</span></div>
                <div className='lon'><span>Lon</span><span>{this.props.mouseCoords.longitude}</span></div>
            </li>);
        }
        return (
            <li className="location-bar--zone">
                <div className='zone'><span>ZONE</span><span>{this.props.mouseCoords.utmZone}</span></div>
                <div className='e'><span>E</span><span>{this.props.mouseCoords.east}</span></div>
                <div className='n'><span>N</span><span>{this.props.mouseCoords.north}</span></div>
            </li>
        );
    },

    renderElevation() {
        return (
            <li>
                <span>Elev</span>
                <span>{this.props.mouseCoords.elevation}</span>
            </li>
        );
    },

    render() {
        return (
            <button type='button' className='location-bar btn' onClick={this.toggleUseProjection}>
                {this.renderLatitudeLongitude()}
                {this.renderElevation()}
            </button>
        );
    }
});

module.exports = LocationBar;
