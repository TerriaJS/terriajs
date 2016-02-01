'use strict';

import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';

/**
 * Super-simple dumb search box component.
 */
export default React.createClass({
    propTypes: {
        initialSearchText: React.PropTypes.string,
        onSearchTextChanged: React.PropTypes.func.isRequired
    },

    getDefaultProps() {
        return {
            initialSearchText: ''
        };
    },

    getInitialState() {
        return {
            hasValue: !!this.props.initialSearchText.length
        };
    },

    searchWithDebounce(value) {
        // Trigger search 250ms after the last input.
        this.removeDebounceTimeout();

        this.debounceTimeout = setTimeout(() => {
            this.props.onSearchTextChanged(value);
            this.debounceTimeout = undefined;
        }, 250);
    },

    removeDebounceTimeout() {
        if (defined(this.debounceTimeout)) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = undefined;
        }
    },

    handleChange(event) {
        const value = event.target.value;

        this.setState({
            hasValue: !!value.length
        });

        this.searchWithDebounce(value);
    },

    clearSearch(event) {
        this.refs.searchBox.value = '';
        this.searchWithDebounce('');
    },

    render() {
        const clearButton = (
            <button className='btn search-clear' onClick={this.clearSearch}>
                <i className='icon icon-clear'/>
            </button>
        );

        return (
            <form className='search-data-form relative' autoComplete='off' onSubmit={event => event.preventDefault()}>
                <label htmlFor='search' className='hide'>Type keyword to search</label>
                <i className='icon icon-search'/>
                <input type='text'
                       name='search'
                       ref="searchBox"
                       defaultValue={this.props.initialSearchText}
                       onChange={this.handleChange}
                       className='search__field field'
                       placeholder='Search'
                       autoComplete='off'/>
                {this.state.hasValue && clearButton}
            </form>
        );
    }
});
