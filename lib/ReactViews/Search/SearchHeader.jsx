"use strict";

import React from 'react';
import Loader from '../Loader.jsx';
/**
 *  Renders either a loader or a message based off search state.
 *
 *  @param {Object} props props
 *  @returns {ReactComponent} The component
 */
export default props => {
    if (this.props.isSearching) {
        return <div><Loader key="loader"/></div>;
    } else if (this.props.searchMessage) {
        return <div key="message" className='label no-results'>{this.props.searchMessage}</div>;
    }

    return null;
};
