import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import SearchHeader from './SearchHeader.jsx';
import SearchResult from './SearchResult.jsx';
import classNames from 'classnames';
import Icon from "../Icon.jsx";
import Styles from './location-search-result.scss';
import addGeoJsonFeatureFromWorkbenchData from '../../Models/addGeoJsonFeatureFromWorkbenchData.js';

const WorkbenchDataSearchResults = createReactClass({
    displayName: 'WorkbenchDataSearchResults',
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: PropTypes.object.isRequired,
        isWaitingForSearchToStart: PropTypes.bool,
        terria: PropTypes.object.isRequired,
        search: PropTypes.object,
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

    onMatchClick(result) {
        addGeoJsonFeatureFromWorkbenchData(this.props.terria, result);
    },

    toggleGroup() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    toggleExpand() {
      this.setState({
          isExpanded: !this.state.isExpanded
      });
    },

    renderResultsFooter() {
      if (this.state.isExpanded) {
        return `Hide results from Workbench Data`;
      }
      return `View ${this.props.search.searchResults.length} results from Workbench Data`;
    },

    render() {
        const search = this.props.search;
        const results = this.state.isExpanded ? search.searchResults : [];
        return (<div className={classNames(Styles.providerResult, {[Styles.isOpen]: this.state.isOpen, [Styles.dark]: this.props.theme === 'dark', [Styles.light]: this.props.theme === 'light'})}>
                    <button onClick={this.toggleGroup} className={Styles.heading}>
                        <span>Workbench Data</span>
                        <Icon glyph={this.state.isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}/>
                    </button>
                    <SearchHeader searchProvider={search}
                                  isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}/>
                    <ul className={Styles.items}>

                        {results.map((result, i) => (
                            <SearchResult key={i}
                                          clickAction={this.onMatchClick.bind(null, result)}
                                          name={`${result.matchFieldText.toUpperCase()} (${result.workbenchItem.name})`}
                                          icon='data'
                                          theme={this.props.theme}/>
                        ))}
                        {search.searchResults.length > 0 && <button className={Styles.footer} onClick={this.toggleExpand}>{this.renderResultsFooter()}<Icon glyph={this.state.isExpanded ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}/></button>}
                    </ul>
                </div>);
    },
});

module.exports = WorkbenchDataSearchResults;
