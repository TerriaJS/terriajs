'use strict';

import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import Styles from './search.scss';
import when from 'terriajs-cesium/Source/ThirdParty/when';

/**
 * Super-simple dumb search box component.
 * Used for both data catalog search and location search.
 */
export default React.createClass({
    propTypes: {
        onSearchTextChanged: React.PropTypes.func.isRequired,
        initialText: React.PropTypes.string,
        onFocus: React.PropTypes.func,
        onEnterPressed: React.PropTypes.func
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
        return !!this.state.text.length;
    },

    searchWithDebounce() {
        // Trigger search 250ms after the last input.
        this.removeDebounce();

        const deferred = when.defer();
        this.debouncePromise = deferred.promise;
        this.debounceTimeout = setTimeout(() => {
            this.props.onSearchTextChanged(this.state.text);
            this.debounceTimeout = undefined;
            deferred.resolve();
        }, 250);
    },

    removeDebounce() {
        if (defined(this.debounceTimeout)) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = undefined;
            this.debouncePromise = undefined;
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

    onKeyDown(event) {
        if (event.keyCode === 13 && this.props.onEnterPressed) {
            const triggerOnEnterPressed = () => this.props.onEnterPressed(event);

            if (this.debouncePromise) {
                this.debouncePromise.then(triggerOnEnterPressed);
            } else {
                triggerOnEnterPressed();
            }
        }
    },

    render() {
        const clearButton = (
            <button type='button' className='searchClear' onClick={this.clearSearch} />
        );

        return (
            <form className={Styles.searchData} autoComplete='off' onSubmit={event => event.preventDefault()}>
                <label htmlFor='search' className={Styles.formLabel}> Type keyword to search </label>
                <input id='search'
                       type='text'
                       name='search'
                       value={this.state.text}
                       onChange={this.handleChange}
                       onFocus={this.props.onFocus}
                       onKeyDown={this.onKeyDown}
                       className={Styles.searchField}
                       placeholder='Search'
                       autoComplete='off'/>
                {this.hasValue() && clearButton}
            </form>
        );
    }
});
