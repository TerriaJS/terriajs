import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import SearchHeader from './SearchHeader';
import SearchResult from './SearchResult';
import classNames from 'classnames';
import Icon from "../Icon";
import Styles from './location-search-result.scss';

const LocationSearchResults = createReactClass({
    displayName: 'LocationSearchResults',
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: PropTypes.object.isRequired,
        isWaitingForSearchToStart: PropTypes.bool,
        terria: PropTypes.object.isRequired,
        search: PropTypes.object.isRequired,
        onLocationClick: PropTypes.func.isRequired,
        theme: PropTypes.string
    },

    getInitialState() {
        return {
            isOpen: true
        };
    },

    getDefaultProps() {
        return {
            theme: "dark"
        };
    },

    toggleGroup() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    render() {
        const search = this.props.search;
        return (<div key={search.name}
                     className={classNames(Styles.providerResult, {[Styles.isOpen]: this.state.isOpen, [Styles.dark]: this.props.theme === 'dark', [Styles.light]: this.props.theme === 'light'})}>
                    <button onClick={this.toggleGroup} className={Styles.heading}>
                        <span>{search.name}</span>
                        <Icon glyph={this.state.isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}/>
                    </button>
                    <SearchHeader searchProvider={search}
                                  isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}/>
                    <ul className={Styles.items}>
                        {search.searchResults.map((result, i) => (
                            <SearchResult key={i}
                                          clickAction={this.props.onLocationClick.bind(null, result)}
                                          name={result.name}
                                          theme={this.props.theme}/>
                        ))}
                    </ul>
                </div>);
    },
});

module.exports = LocationSearchResults;
