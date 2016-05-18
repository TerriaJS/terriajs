'use strict';

import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';

// Use this as drop down rather than the html <select> tag so we have more consistent styling
// Uses the contents of the element as the name of the dropdown if none selected.
const Dropdown = React.createClass({
    propTypes: {
        className: React.PropTypes.string, // Class added to the dropdown button.
        options: React.PropTypes.array, // Must be an array of objects with name properties. Uses <a> when there is an href property, else <button type='button'>.
        selected: React.PropTypes.object,
        selectOption: React.PropTypes.func, // The callback function; its arguments are the chosen object and its index.
        textProperty: React.PropTypes.string, // property to display as text
        matchWidth: React.PropTypes.bool,
        buttonClassName: React.PropTypes.string,
        children: React.PropTypes.any
    },

    getDefaultProps() {
        return {
            options: [],
            selected: undefined,
            textProperty: 'name',
            align: 'left'
        };
    },

    getInitialState() {
        return {
            isOpen: false
        };
    },

    componentWillMount() {
        // this._element is updated by the ref callback attribute, https://facebook.github.io/react/docs/more-about-refs.html
        this.buttonElement = undefined;

        this.resetDownloadDropdownPosition();
    },

    resetDownloadDropdownPosition() {
        setTimeout(() => {
            if (!this.dismounted) {
                this.setState({
                    dropdownPosition: {
                        top: 'inherit',
                        left: 'inherit',
                        right: 'inherit'
                    }
                });
            }
        }, 100);
    },

    componentWillUnmount() {
        this.removeListeners();
        this.dismounted = true;
    },

    hideList() {
        this.setState({
            isOpen: false
        });

        this.resetDownloadDropdownPosition();
        this.removeListeners();
    },

    removeListeners() {
        document.body.removeEventListener('click', this.hideList);
        this.buttonElement.removeEventListener('click', this.nativeButtonListener);
        this.nativeButtonListener = undefined;

        (this.scrollListeners || []).forEach(listenerElement => listenerElement.removeEventListener('scroll', this.hideList));
        this.scrollListeners = undefined;
    },

    showList() {
        this.setState({
            isOpen: true
        });

        // Add a listener to every ancestor capable of scrolling that will close the dropdown when this occurs.
        const addScrollListeners = (element, listeningToSoFar) => {
            if (element.scrollHeight > element.clientHeight) {
                element.addEventListener('scroll', this.hideList);
                listeningToSoFar.push(element);
            }

            if (element !== document.body) {
                return addScrollListeners(element.parentNode, listeningToSoFar);
            } else {
                return listeningToSoFar;
            }
        };
        this.scrollListeners = addScrollListeners(this.buttonElement, []);

        // Figure out where the button is on the screen and set the dropdown's fixed position to right below it.
        const outerDropdownPosition = this.buttonElement.getBoundingClientRect();
        const dropdownPosition = {
            top: outerDropdownPosition.bottom + 'px',
            right: window.innerWidth - outerDropdownPosition.right + 'px'
        };

        if (this.props.matchWidth) {
            dropdownPosition.left = outerDropdownPosition.left + 'px';
        }

        this.setState({
            dropdownPosition
        });

        // Add the listener to be triggered when a click happens anywhere on the body (including the toggle button)
        // or the outer panel is scrolled.
        document.body.addEventListener('click', this.hideList);

        // Unfortunately we need to add a native event listener because the native event hits document.body before
        // the react event ever gets triggered.
        this.nativeButtonListener = event => {
            event.stopPropagation();
            this.hideList();
        };

        this.buttonElement.addEventListener('click', this.nativeButtonListener);
    },

    select(option, index) {
        this.props.selectOption(option, index);
        this.hideList();
    },

    onButtonClicked() {
        if (!this.state.isOpen) {
            this.showList();
        } else {
            this.hideList();
        }
    },

    render() {
        return (
            <div className={'dropdown ' + (this.state.isOpen ? 'is-open' : '') + ' ' + (this.props.className || '')}>
                <button type='button' onClick={this.onButtonClicked}
                        className={(this.props.buttonClassName || 'btn--dropdown') + ' btn btn-transparent'}
                        ref={element => {this.buttonElement = element;}}>
                    {defined(this.props.selected) ? this.props.selected[this.props.textProperty] : this.props.children}
                </button>
                <ul className='dropdown__list' style={this.state.dropdownPosition}>
                    <For each="option" of={this.props.options} index="index">
                        <li key={option[this.props.textProperty]}>
                            <Choose>
                                <When condition={option.href}>
                                    <a href={option.href}
                                       className={classNames('btn', 'btn--dropdown-option btn-transparent', {'is-selected': option === this.props.selected})}
                                       download={option.download}>
                                        {option[this.props.textProperty]}
                                    </a>
                                </When>
                                <Otherwise>
                                    <button type='button'
                                            className={classNames('btn', 'btn--dropdown-option btn-transparent', {'is-selected': option === this.props.selected})}
                                            onClick={() => this.select(option, index)}>
                                        {option[this.props.textProperty]}
                                    </button>
                                </Otherwise>
                            </Choose>
                        </li>
                    </For>
                </ul>
            </div>
        );
    }
});

module.exports = Dropdown;
