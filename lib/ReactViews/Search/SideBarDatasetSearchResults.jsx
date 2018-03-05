import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import SearchHeader from './SearchHeader.jsx';
import SearchResult from './SearchResult.jsx';
import classNames from 'classnames';
import Icon from "../Icon.jsx";
import Styles from './sidebar-dataset-search-results.scss';

const SideBarDatasetSearchResults = createReactClass({
    displayName: 'SideBarDatasetSearchResults',
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: PropTypes.object.isRequired,
        terria: PropTypes.object.isRequired,
    },

    getDefaultProps() {
        return {
            theme: "dark"
        };
    },

    getInitialState() {
        return {
            isOpen: true
        };
    },

    searchInDataCatalog() {
        this.props.viewState.searchInCatalog(this.props.viewState.searchState.locationSearchText);
    },

    toggleGroup() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    render() {
        const search = this.props.search;
        return (<div key='data'
                     className={classNames(Styles.providerResult, {[Styles.isOpen]: this.state.isOpen, [Styles.dark]: this.props.theme === 'dark', [Styles.light]: this.props.theme === 'light'})}>
                    <button onClick={this.toggleGroup} className={Styles.heading}>
                        <span>Data</span>
                        <Icon glyph={this.state.isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}/>
                    </button>
                    <ul className={Styles.items}>
                      <SearchResult clickAction={this.searchInDataCatalog}
                                    icon='data'
                                    name={`Search for "${this.props.viewState.searchState.locationSearchText}" in the Data Catalogue`}
                      />
                    </ul>
                </div>);
    },
});

module.exports = SideBarDatasetSearchResults;
