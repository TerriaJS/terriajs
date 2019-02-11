import React from 'react';
import PropTypes from 'prop-types';
import LocationItem from '../../LocationItem.jsx';

import Styles from './satellite-imagery-time-filter-section.scss';

export default function SatelliteImageryTimeFilterSection(props) {
    const position = undefined; // TODO
    return (
        <div className={Styles.wrapper}>
            <div className={Styles.infoGroup}>
                <div>Only showing available capture times for:</div>
                <LocationItem position={position} />
            </div>
            <div className={Styles.btnGroup}>
                <button className={Styles.btn}>Remove filter</button>
                <button className={Styles.btn}>Zoom to</button>
                <button className={Styles.btn}>New location</button>
            </div>
        </div>
    );
}

SatelliteImageryTimeFilterSection.propTypes = {
    item: PropTypes.object
};
