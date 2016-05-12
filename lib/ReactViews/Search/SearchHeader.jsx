"use strict";

import React from 'react';
import Loader from '../Loader.jsx';

/** Renders either a loader or a message based off search state. */
export default React.createClass({
    propTypes: {
        searchProvider: React.PropTypes.object.isRequired
    },

    render() {
        if (this.props.searchProvider.isSearching) {
            return <div><Loader key="loader"/></div>;
        } else if (this.props.searchProvider.searchMessage) {
            return <div key="message" className='label no-results'>{this.props.searchProvider.searchMessage}</div>;
        } else {
            return null;
        }
    }
});
