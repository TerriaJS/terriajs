'use strict';

import React from 'react';
import classnames from 'classnames';

const DropdownPanel = React.createClass({
    propTypes: {
        btnClass: React.PropTypes.string.isRequired,
        btnTitle: React.PropTypes.string,
        btnText: React.PropTypes.string
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
        window.removeEventListener('click', this.closeDropDownWhenClickOtherPlaces);
    },

    closeDropDownWhenClickOtherPlaces() {
        this.setState({
            isOpen: false
        });
    },

    togglePanel(e) {
        e.stopPropagation();
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    render() {
        return (
            <div className={classnames({'is-open': this.state.isOpen}, this.props.className)}>
                <button onClick={this.togglePanel}
                        type='button'
                        className={classnames('dd-panel__button', 'btn', this.props.btnClass)}
                        title={this.props.btnTitle}>
                    {this.props.btnText}
                </button>
                <If condition={this.state.isOpen}>
                    <div className='dd-panel__inner'>
                        {React.Children.map(this.props.children, child =>
                            React.cloneElement(child, {
                                isOpen: this.state.isOpen
                            })
                        )}
                    </div>
                </If>
            </div>
        );
    }
});

export default DropdownPanel;
