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

    componentWillUnmount() {
        window.removeEventListener('click', this.close);
    },

    close(e) {
        // Only close if this wasn't a click on our open/close button.
        if (!e[this.getDoNotReactId()]) {
            this.setOpen(false);
        }
    },

    onPanelClicked(e) {
        e.stopPropagation();
    },

    togglePanel(e) {
        // Tag this event so that we know not to react to it when it hits the window.
        // We could just set stopPropagation on it, but this would mean that clicks on other buttons that stopPropagation
        // would cause the panel not to close.
        e.nativeEvent[this.getDoNotReactId()] = true;

        this.setOpen(!this.state.isOpen);
    },

    setOpen(open) {
        if (open) {
            window.addEventListener('click', this.close);
        } else {
            window.removeEventListener('click', this.close);
        }

        this.setState({
            isOpen: open
        });
    },

    getDoNotReactId() {
        return `do-not-react-${this.props.btnText}-${this.props.btnTitle}-${this.props.btnClass}`;
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
                    <div className='dd-panel__inner' onClick={this.onPanelClicked}>
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
