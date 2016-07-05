'use strict';

import React from 'react';
import classNames from 'classnames';
import Icon from "../../Icon.jsx";

import Styles from './dropdown-panel.scss';

import defined from 'terriajs-cesium/Source/Core/defined';

const DropdownPanel = React.createClass({
    propTypes: {
        theme: React.PropTypes.object.isRequired,
        children: React.PropTypes.any,
        btnTitle: React.PropTypes.string,
        btnText: React.PropTypes.string,
        onOpenChanged: React.PropTypes.func,
        viewState: React.PropTypes.object
    },

    getDefaultProps() {
        return {
            onOpenChanged: () => {}
        };
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

            setTimeout(() => {
                this.setState({
                    isOpenCss: true
                });
                this.props.onOpenChanged(open);
            }, 0);
        } else {
            window.removeEventListener('click', this.close);

            // If we're closing we want to immediately change the css class to cause it to animate shut, then when it's
            // finished actually stop it rendering with isOpen = false
            this.setState({
                isOpenCss: false
            });

            setTimeout(() => {
                this.setState({
                    isOpen: false
                });
                this.props.onOpenChanged(open);
            }, 200); // TODO: Determine when it stops animating instead of duplicating the 200ms timeout?
        }
    },

    onInnerMounted(innerElement) {
        if (innerElement) {
            // how much further right the panel is from the button
            const offset = this.buttonElement.offsetLeft - innerElement.offsetLeft;
            // if the panel is left of the button leave its offset as is, otherwise move it right so it's level with the button.
            const dropdownOffset = offset < innerElement.offsetLeft ? offset : innerElement.offsetLeft;
            // offset the caret to line up with the middle of the button - note that the caret offset is relative to the panel, whereas
            // the offsets for the button/panel are relative to their container.
            const caretOffset = Math.max((this.buttonElement.clientWidth / 2 - 10) - (dropdownOffset - this.buttonElement.offsetLeft), 0);

            this.setState({
                caretOffset: caretOffset >= 0 && (caretOffset + 'px'),
                dropdownOffset: dropdownOffset + 'px'
            });
        } else {
            this.setState({
                caretOffset: undefined,
                dropdownOffset: undefined
            });
        }
    },

    getDoNotReactId() {
        return `do-not-react-${this.props.btnText}-${this.props.btnTitle}-${this.props.theme.btn}`;
    },

    bringToFront() {
        this.props.viewState.switchComponentOrder(this.props.viewState.componentOrderOptions.dropdownPanel);
    },

    render() {
        return (
            <div className={classNames({[Styles.isOpen]: this.state.isOpenCss}, Styles.panel, this.props.theme.outer)}>
                <button onClick={this.togglePanel}
                        type='button'
                        className={classNames(Styles.button, this.props.theme.btn)}
                        title={this.props.btnTitle}
                        ref={element => this.buttonElement = element}>
                    <If condition={this.props.theme.icon}>
                        <Icon glyph={Icon.GLYPHS[this.props.theme.icon]}/>
                    </If>
                    <span>{this.props.btnText}</span>
                </button>
                <If condition={this.state.isOpen}>
                    <div className={classNames(
                            Styles.inner,
                            this.props.theme.inner,
                            {[Styles.innerIsOnTop]: this.props.viewState.componentOnTop === this.props.viewState.componentOrderOptions.dropdownPanel}
                         )}
                         onClick={this.onPanelClicked}
                         ref={this.onInnerMounted}
                         style={{
                             left: this.state.dropdownOffset,
                             transformOrigin: `${this.state.caretOffset} top`
                         }}>
                        <If condition={defined(this.state.caretOffset)}>
                            <span className={Styles.caret}
                                  style={{left: this.state.caretOffset}}/>
                        </If>
                        <div className={Styles.content}>
                            {this.props.children}
                        </div>
                    </div>
                </If>
            </div>
        );
    }
});

export default DropdownPanel;
