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
            initialText: ''
        };
    },

    getInitialState() {
        return {
            text: this.props.initialText
        };
    },

    hasValue() {
        return !!this.state.text.length
    },

    searchWithDebounce() {
        // Trigger search 250ms after the last input.
        this.removeDebounceTimeout();

        this.debounceTimeout = setTimeout(() => {
            this.props.onSearchTextChanged(this.state.text);
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
            text: value
        });

        this.searchWithDebounce();
    },

    clearSearch() {
        this.setState({
           text: ''
        });
        this.searchWithDebounce();
    },

    setText(text) {
        this.setState({
            text: text
        });
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
                       value={this.state.text}
                       onChange={this.handleChange}
                       className='search__field field'
                       placeholder='Search'
                       autoComplete='off'/>
                {this.hasValue() && clearButton}
            </form>
        );
    }
});
