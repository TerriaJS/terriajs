'use strict';
import classNames from "classnames";
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import Styles from './legend.scss';

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

    render() {
        return (
            <button type='button' className={classNames(Styles.locationBar, {[Styles.useProjection]: this.props.mouseCoords.useProjection})} onClick={this.toggleUseProjection}>
                <Choose>
                    <When condition={!this.props.mouseCoords.useProjection}>
                        <div><span>Lat</span><span>{this.props.mouseCoords.latitude}</span></div>
                        <div><span>Lon</span><span>{this.props.mouseCoords.longitude}</span></div>
                    </When>
                    <Otherwise>
                        <div><span>ZONE</span><span>{this.props.mouseCoords.utmZone}</span></div>
                        <div><span>E</span><span>{this.props.mouseCoords.east}</span></div>
                        <div><span>N</span><span>{this.props.mouseCoords.north}</span></div>
                    </Otherwise>
                </Choose>
                <div>
                    <span>Elev</span>
                    <span>{this.props.mouseCoords.elevation}</span>
                </div>
            </button>
        );
    }
});

module.exports = LocationBar;
