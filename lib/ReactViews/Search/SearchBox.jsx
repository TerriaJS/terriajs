'use strict';

import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import Styles from './search-box.scss';
import debounce from 'lodash.debounce';
import Icon from "../Icon.jsx";

/**
 * Super-simple dumb search box component.
 * Used for both data catalog search and location search.
 */
export default React.createClass({
    propTypes: {
        onSearchTextChanged: React.PropTypes.func.isRequired,
        onDoSearch: React.PropTypes.func.isRequired,
        searchText: React.PropTypes.string.isRequired,
        onFocus: React.PropTypes.func,
        searchBoxLabel: React.PropTypes.string,
        onClear: React.PropTypes.func,
        alwaysShowClear: React.PropTypes.bool,
        autoFocus: React.PropTypes.bool
    },

    getDefaultProps() {
        return {
            searchBoxLabel: 'Search',
            alwaysShowClear: false,
            autoFocus: false
        };
    },

    componentWillMount() {
        this.debounced = debounce(this.search, 200);
    },

    componentWillUnmount() {
        this.removeDebounce();
    },

    hasValue() {
        return this.props.searchText.length > 0;
    },

    searchWithDebounce() {
        this.removeDebounce();
        // Trigger search 2 seconds after the last input.
        if (this.props.searchText.length > 0) {
            this.debounced();
        }
    },

    search() {
        this.removeDebounce();
        this.props.onDoSearch();
    },

    removeDebounce() {
        this.debounced.cancel();
    },

    handleChange(event) {
        const value = event.target.value;
        this.props.onSearchTextChanged(value);
        this.searchWithDebounce();
    },

    clearSearch() {
        this.props.onSearchTextChanged('');
        this.search();

        if (this.props.onClear) {
            this.props.onClear();
        }
    },

    onKeyDown(event) {
        if (event.keyCode === 13) {
            this.search();
        }
    },

    render() {
        const clearButton = (
            <button type='button' className={Styles.searchClear} onClick={this.clearSearch}><Icon glyph={Icon.GLYPHS.close}/></button>
        );

        return (
            <form className={Styles.searchData} autoComplete='off' onSubmit={event => event.preventDefault()}>
                <label htmlFor='search' className={Styles.formLabel}>
                <Icon glyph={Icon.GLYPHS.search}/>
                </label>
                <input id='search'
                       type='text'
                       name='search'
                       value={this.props.searchText}
                       onChange={this.handleChange}
                       onFocus={this.props.onFocus}
                       onKeyDown={this.onKeyDown}
                       className={Styles.searchField}
                       placeholder={this.props.searchBoxLabel}
                       autoComplete='off'
                       autoFocus={this.props.autoFocus} />
                {(this.props.alwaysShowClear || this.hasValue()) && clearButton}
            </form>
        );
    }
});
