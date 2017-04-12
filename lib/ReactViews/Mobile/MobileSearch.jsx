import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

import {addMarker} from '../Search/SearchMarkerUtils';
import ObserveModelMixin from '../ObserveModelMixin';
import LocationSearchResults from '../Search/LocationSearchResults.jsx';
import Styles from './mobile-search.scss';

// A Location item when doing Bing map searvh or Gazetter search
const MobileSearch = createReactClass({
    displayName: 'MobileSearch',
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: PropTypes.object,
        terria: PropTypes.object
    },

    onLocationClick(result) {
        result.clickAction();

        addMarker(this.props.terria, this.props.viewState, result);

        // Close modal window
        this.props.viewState.switchMobileView(null);
        this.props.viewState.searchState.showMobileLocationSearch = false;
    },

    render() {
        return (
            <div className={Styles.mobileSearch}>
                <div className={Styles.location}>
                    {this.renderLocationResult()}
                </div>
            </div>
        );
    },

    renderLocationResult() {
        const searchState = this.props.viewState.searchState;
        const theme = 'light';
        return searchState.locationSearchProviders
            .filter(search => search.isSearching || (search.searchResults && search.searchResults.length))
            .map(search =>
                <LocationSearchResults key={search.name}
                                       terria={this.props.terria}
                                       viewState={this.props.viewState}
                                       search={search}
                                       onLocationClick={this.onLocationClick}
                                       isWaitingForSearchToStart={searchState.isWaitingForSearchToStart}
                                       theme={theme}

                />
            );
    },
});

module.exports = MobileSearch;
