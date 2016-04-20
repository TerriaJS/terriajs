'use strict';

import React from 'react';
import classnames from 'classnames';

const DropdownPanel = React.createClass({
    propTypes: {
        btnClass: React.PropTypes.string.isRequired,
        children: React.PropTypes.oneOfType([
            React.PropTypes.array,
            React.PropTypes.object
        ]).isRequired,
        btnTitle: React.PropTypes.string,
        btnText: React.PropTypes.string,
        className: React.PropTypes.string
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

            // If we're opening we want to immediately cause the panel to render, then just after then change the css
            // class on it so it animates.
            this.setState({
                isOpen: true
            });

            setTimeout(() => this.setState({
                isOpenCss: true
            }), 0);
        } else {
            window.removeEventListener('click', this.close);

            // If we're closing we want to immediately change the css class to cause it to animate shut, then when it's
            // finished actually stop it rendering with isOpen = false
            this.setState({
                isOpenCss: false
            });

            setTimeout(() => this.setState({
                isOpen: false
            }), 200); // TODO: Determine when it stops animating instead of duplicating the 200ms timeout?
        }
    },

    getDoNotReactId() {
        return `do-not-react-${this.props.btnText}-${this.props.btnTitle}-${this.props.btnClass}`;
    },

    render() {
        return (
            <div className={classnames({'is-open': this.state.isOpenCss}, this.props.className)}>
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
