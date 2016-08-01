import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SearchHeader from './SearchHeader.jsx';
import SearchResult from './SearchResult.jsx';
import classNames from 'classnames';
import Icon from "../Icon.jsx";
import Styles from './location-search-result.scss';

const LocationSearchResults = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        isWaitingForSearchToStart: React.PropTypes.bool,
        terria: React.PropTypes.object.isRequired,
        search: React.PropTypes.object.isRequired,
        onLocationClick: React.PropTypes.func.isRequired,
    },

    getInitialState() {
        return {
            isOpen: true
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
                     className={classNames(Styles.providerResult, {[Styles.isOpen]: this.state.isOpen})}>
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
    }
});

module.exports = LocationSearchResults;
