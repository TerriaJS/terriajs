import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import prettifyCoordinates from '../Map/prettifyCoordinates';
import React from 'react';
import PropTypes from 'prop-types';
import Styles from './location-item.scss';

export default function LocationItem(props) {
    let latitude = '';
    let longitude = '';
    if (props.position) {
        const cartesianPosition = props.position;
        const catographic = Ellipsoid.WGS84.cartesianToCartographic(cartesianPosition);
        const latitudeRaw = CesiumMath.toDegrees(catographic.latitude);
        const longitudeRaw = CesiumMath.toDegrees(catographic.longitude);
        const pretty = prettifyCoordinates(longitudeRaw, latitudeRaw);
        latitude = pretty.latitude;
        longitude = pretty.longitude;
    }
    return (
        <div className={Styles.location}>
            <span>Lat / Lon&nbsp;</span>
            <span>
                {latitude + ", " + longitude}
            </span>
        </div>
    );
}

LocationItem.propTypes = {
    position: PropTypes.object
};
