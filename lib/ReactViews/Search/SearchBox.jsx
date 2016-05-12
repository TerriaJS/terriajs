'use strict';

import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';

/**
 * Super-simple dumb search box component.
 * Used for both data catalog search and location search.
 */
export default React.createClass({
    propTypes: {
        onSearchTextChanged: React.PropTypes.func.isRequired,
        onDoSearch: React.PropTypes.func.isRequired,
        searchText: React.PropTypes.string.isRequired,
        onFocus: React.PropTypes.func
    },

    componentWillUnmount() {
        this.removeDebounce();
    },

    hasValue() {
        return this.props.searchText.length > 0;
    },

    searchWithDebounce() {
        // Trigger search 2 seconds after the last input.
        this.removeDebounce();

        if (this.props.searchText.length > 0) {
            this.debounceTimeout = setTimeout(() => {
                this.search();
            }, 2000);
        }
    },

    search() {
        this.removeDebounce();
        this.props.onDoSearch();
    },

    removeDebounce() {
        if (defined(this.debounceTimeout)) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = undefined;
        }
    },

    handleChange(event) {
        const value = event.target.value;
        this.props.onSearchTextChanged(value);
        this.searchWithDebounce();
    },

    clearSearch() {
        this.props.onSearchTextChanged('');
        this.search();
    },

    onKeyDown(event) {
        if (event.keyCode === 13) {
            this.search();
        }
    },

    render() {
        const clearButton = (
            <button type='button' className='btn btn--search-clear' onClick={this.clearSearch} />
        );

        return (
            <form className='form--search-data' autoComplete='off' onSubmit={event => event.preventDefault()}>
                <label htmlFor='search' className='form__label'> Type keyword to search </label>
                <input id='search'
                       type='text'
                       name='search'
                       value={this.props.searchText}
                       onChange={this.handleChange}
                       onFocus={this.props.onFocus}
                       onKeyDown={this.onKeyDown}
                       className='form__search-field field'
                       placeholder='Search'
                       autoComplete='off'/>
                {this.hasValue() && clearButton}
            </form>
        );
    }
});
