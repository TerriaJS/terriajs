'use strict';
import React from 'react';
import L from 'leaflet';
import Cartesian2 from 'terriajs-cesium/Source/Core/Cartesian2';
import defined from 'terriajs-cesium/Source/Core/defined';
import DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';
import EllipsoidGeodesic from 'terriajs-cesium/Source/Core/EllipsoidGeodesic';
import getTimestamp from 'terriajs-cesium/Source/Core/getTimestamp';
import ObserveModelMixin from './ObserveModelMixin';

const geodesic = new EllipsoidGeodesic();

const distances = [
    1, 2, 3, 5,
    10, 20, 30, 50,
    100, 200, 300, 500,
    1000, 2000, 3000, 5000,
    10000, 20000, 30000, 50000,
    100000, 200000, 300000, 500000,
    1000000, 2000000, 3000000, 5000000,
    10000000, 20000000, 30000000, 50000000];

const DistanceLegend = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
    },

    getInitialState() {
        return {
            distanceLabel: undefined,
            barWidth: 0
        };
    },

    componentDidMount() {
        this._removeSubscription = undefined;
        this._lastLegendUpdate = undefined;

        this.props.terria.beforeViewerChanged.addEventListener(()=>{
            if (defined(this._removeSubscription)) {
                this._removeSubscription();
                this._removeSubscription = undefined;
            }
        });

        this.addUpdateSubscription();

        this.props.terria.afterViewerChanged.addEventListener(()=>{
            this.addUpdateSubscription();
        });
    },

    addUpdateSubscription() {
        const that = this;
        if (defined(this.props.terria.cesium)) {
            const scene = this.props.terria.cesium.scene;
            this._removeSubscription = scene.postRender.addEventListener(()=>{
                this.updateDistanceLegendCesium(scene);
            });
        } else if (defined(this.props.terria.leaflet)) {
            const map = this.props.terria.leaflet.map;

            const potentialChangeCallback = function potentialChangeCallback() {
                that.updateDistanceLegendLeaflet(map);
            };

            that._removeSubscription = function() {
                map.off('zoomend', potentialChangeCallback);
                map.off('moveend', potentialChangeCallback);
            };

            map.on('zoomend', potentialChangeCallback);
            map.on('moveend', potentialChangeCallback);

            that.updateDistanceLegendLeaflet(map);
        }
    },

    updateDistanceLegendCesium(scene) {
        const now = getTimestamp();
        if (now < this._lastLegendUpdate + 250) {
            return;
        }

        this._lastLegendUpdate = now;

        // Find the distance between two pixels at the bottom center of the screen.
        const width = scene.canvas.clientWidth;
        const height = scene.canvas.clientHeight;

        const left = scene.camera.getPickRay(new Cartesian2((width / 2) | 0, height - 1));
        const right = scene.camera.getPickRay(new Cartesian2(1 + (width / 2) | 0, height - 1));

        const globe = scene.globe;
        const leftPosition = globe.pick(left, scene);
        const rightPosition = globe.pick(right, scene);

        if (!defined(leftPosition) || !defined(rightPosition)) {
            this.setState({
                barWidth: undefined,
                distanceLabel: undefined
            });
            return;
        }

        const leftCartographic = globe.ellipsoid.cartesianToCartographic(leftPosition);
        const rightCartographic = globe.ellipsoid.cartesianToCartographic(rightPosition);

        geodesic.setEndPoints(leftCartographic, rightCartographic);
        const pixelDistance = geodesic.surfaceDistance;

        // Find the first distance that makes the scale bar less than 100 pixels.
        const maxBarWidth = 100;
        let distance;
        for (let i = distances.length - 1; !defined(distance) && i >= 0; --i) {
            if (distances[i] / pixelDistance < maxBarWidth) {
                distance = distances[i];
            }
        }

        if (defined(distance)) {
            let label;
            if (distance >= 1000) {
                label = (distance / 1000).toString() + ' km';
            } else {
                label = distance.toString() + ' m';
            }

            this.setState({
                barWidth: (distance / pixelDistance) | 0,
                distanceLabel: label
            });

        } else {
            this.setState({
                barWidth: undefined,
                distanceLabel: undefined
            });
        }
    },

    updateDistanceLegendLeaflet(map) {
        const halfHeight = map.getSize().y / 2;
        const maxPixelWidth = 100;
        const maxMeters = map.containerPointToLatLng([0, halfHeight]).distanceTo(
            map.containerPointToLatLng([maxPixelWidth, halfHeight]));

        const meters = L.control.scale()._getRoundNum(maxMeters);
        const label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';

        this.setState({
            barWidth: (meters / maxMeters) * maxPixelWidth,
            distanceLabel: label
        });
    },

    render() {
        const barStyle = {
            width: this.state.barWidth + 'px',
            left: (5 + (125 - this.state.barWidth) / 2) + 'px',
            height: '5px',
            backgroundColor: 'yellow'
        };

        return (<div className='distance-legend'>
                  <label> {this.state.distanceLabel}</label>
                  <div style={barStyle}></div>
                </div>);
    }
});
module.exports = DistanceLegend;
