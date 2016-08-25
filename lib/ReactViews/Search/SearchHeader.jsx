import Loader from '../Loader.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import Styles from './search-header.scss';

/** Renders either a loader or a message based off search state. */
export default React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        searchProvider: React.PropTypes.object.isRequired,
        isWaitingForSearchToStart: React.PropTypes.bool
    },

    render() {
        if (this.props.searchProvider.isSearching || this.props.isWaitingForSearchToStart) {
            return <div key="loader" className={Styles.loader}><Loader/></div>;
        } else if (this.props.searchProvider.searchMessage) {
            return <div key="message" className={Styles.noResults}>{this.props.searchProvider.searchMessage}</div>;
        } else {
            return null;
        }
    }
});
