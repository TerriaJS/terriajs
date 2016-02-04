"use strict";

import React from 'react';
import Loader from '../Loader.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';

/** Renders either a loader or a message based off search state. */
export default React.createClass({
    render() {
        if (this.props.isSearching) {
            return <Loader key="loader"/>;
        } else if (this.props.searchMessage) {
            return <li key="message" className='label no-results'>{this.props.searchMessage}</li>;
        } else {
            return null;
        }
    }
});
