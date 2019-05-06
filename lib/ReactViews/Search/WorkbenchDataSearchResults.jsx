import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import SearchHeader from './SearchHeader.jsx';
import SearchResult from './SearchResult.jsx';
import classNames from 'classnames';
import Icon from "../Icon.jsx";
import Styles from './location-search-result.scss';

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

    onDataClick(d) {
        console.log(this);
        console.log(d);
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
      if(this.state.isExpanded) {
        return `View less ${this.props.search.name} results`;
      }
      return `View more ${this.props.search.name} results`;
    },

    render() {
        const search = this.props.search;
        const allDatasetResults = [];
        for (let i = 0; i < search.searchResults.length; i++) {
            const ds = search.searchResults[i];
            for (let ii = 0; ii < ds.results.length; ii++) {
                allDatasetResults.push({match: ds.results[ii], WorkbenchItem: ds});
            }
        }
        const results = allDatasetResults.length > 5 ? (this.state.isExpanded ? allDatasetResults : allDatasetResults.slice(0, 5)) : allDatasetResults;
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
                                          clickAction={this.onDataClick.bind(null, result)}
                                          name={result.match.match.toUpperCase()}
                                          icon='data'
                                          theme={this.props.theme}/>
                        ))}
                        {search.searchResults.length > 5  && <button className={Styles.footer} onClick={this.toggleExpand}>{this.renderResultsFooter()}<Icon glyph={this.state.isExpanded ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}/></button>}
                    </ul>
                </div>);
    },
});

module.exports = WorkbenchDataSearchResults;
