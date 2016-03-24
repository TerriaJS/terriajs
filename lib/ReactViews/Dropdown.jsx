'use strict';

import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';

// Use this as drop down rather than the html <select> tag so we have more consistent styling
// Uses the contents of the element as the name of the dropdown if none selected.
const Dropdown = React.createClass({
    propTypes: {
        className: React.PropTypes.string, // Class added to the dropdown button.
        options: React.PropTypes.array, // Must be an array of objects with name properties. Uses <a> when there is an href property, else <button>.
        selected: React.PropTypes.object,
        selectOption: React.PropTypes.func, // The callback function; its arguments are the chosen object and its index.
        textProperty: React.PropTypes.string // property to display as text
    },

    // this._element is updated by the ref callback attribute, https://facebook.github.io/react/docs/more-about-refs.html
    _element: undefined,

    getDefaultProps() {
        return {
            options: [],
            selected: undefined,
            textProperty: 'name'
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

    closeDropDownWhenClickOtherPlaces(evt) {
        // If this dropdown is already closed, don't worry about the rest of the checks.
        if (!this.state.isOpen) {
            return;
        }
        // console.log('closeDropDownWhenClickOtherPlaces', evt.target, this._element, 'isOpen:', this.state.isOpen);
        // Ignore if we clicked on this element.
        if (evt.target === this._element) {
            return;
        }
        // Ignore if we clicked on any children of this element. Might want to extend this recursively?
        for (let i = this._element.childNodes.length - 1; i >= 0; i--) {
            if (evt.target === this._element.childNodes[i]) {
                return;
            }
        }
        // Ignore if we clicked on the parent of this element.
        if (evt.target === this._element.parentElement) {
            return;
        }
        this.setState({
            isOpen: false
        });
    },

    toggleList(event) {
        // event.stopPropagation();
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    select(option, index, event) {
        event.stopPropagation();
        this.props.selectOption(option, index);
        // close drop down on select
        this.setState({
            isOpen: false
        });
    },

    renderOptions() {
        const that = this;
        return that.props.options.map((option, i)=>{
            return (<li key={i}>{renderOption(that, option, i)}</li>);
        });
    },

    render() {
        return (
            <div className={'dropdown ' + (this.state.isOpen ? 'is-open' : '')}>
                <button onClick={this.toggleList} className={'btn btn--dropdown ' + (this.props.className || '')} ref={element=>{this._element = element;}}>
                    {defined(this.props.selected) ? this.props.selected[this.props.textProperty] : this.props.children}
                </button>
                <ul className='dropdown__list'>{this.renderOptions()}</ul>
            </div>
        );
    }
});

function renderOption(that, option, index) {
    const className = 'btn btn--dropdown-option ' + (option === that.props.selected ? 'is-selected' : '');
    if (defined(option.href)) {
        return (
            <a href={option.href} className={className}>{option[that.props.textProperty]}</a>
        );
    }
    return (
        <button onClick={that.select.bind(null, option, index)} className={className}>{option[that.props.textProperty]}</button>
    );
}

module.exports = Dropdown;
