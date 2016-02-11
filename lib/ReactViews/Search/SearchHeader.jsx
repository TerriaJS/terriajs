"use strict";

import React from 'react';
import Loader from '../Loader.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';

/** Renders either a loader or a message based off search state. */
export default React.createClass({
    render() {
        if (this.props.isSearching) {
            return <li><Loader key="loader"/></li>;
        } else if (this.props.searchMessage) {
            return <li key="message" className='label no-results'>{this.props.searchMessage}</li>;
        } else {
            return null;
        }
    }
});
