'use strict';

import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';

// Use this as drop down rather than the html <select> tag so we have more consistent styling
// Uses the contents of the element as the name of the dropdown if none selected.
const Dropdown = React.createClass({
    propTypes: {
        options: React.PropTypes.array, // Must be an array of objects with name properties.
        selected: React.PropTypes.object,
        selectOption: React.PropTypes.func // The callback function; its arguments are the chosen object and its index.
    },

    getDefaultProps() {
        return {
            options: [],
            selected: undefined
        };
    },

    getInitialState() {
        return {
            isOpen: false
        };
    },

    componentWillMount() {
        window.addEventListener('click', this.closeDropDownWhenClickOtherPlaces);
    },

    componentWillUnmount() {
        this.setState({
            isOpen: false
        });
        window.removeEventListener('click', this.closeDropDownWhenClickOtherPlaces);
    },

    closeDropDownWhenClickOtherPlaces() {
        this.setState({
            isOpen: false
        });
    },

    toggleList(event) {
        event.stopPropagation();
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    select(option, index, event) {
        event.stopPropagation();
        console.log('dropdown', option, index, event);
        this.props.selectOption(option, index);
        // close drop down on select
        this.setState({
            isOpen: false
        });
    },

    renderOptions() {
        const that = this;
        return that.props.options.map((option, i)=>{
            return (<li key={i}><button onClick={that.select.bind(null, option, i)} className={'btn btn--dropdown-option ' + (option === that.props.selected ? 'is-selected' : '')}>{option.name}</button></li>);
        });
    },

    render() {
        return (<div className={'dropdown ' + (this.state.isOpen ? 'is-open' : '')}>
                  <button onClick={this.toggleList} className='btn btn--dropdown' >
                    {defined(this.props.selected) ? this.props.selected.name : this.props.children}
                    <span className="icon icon-dropdown"></span>
                  </button>
                  <ul className='dropdown__list'>{this.renderOptions()}</ul>
                </div>);
    }
});
module.exports = Dropdown;
