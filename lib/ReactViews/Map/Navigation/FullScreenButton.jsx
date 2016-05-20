'use strict';
const React = require('react');
import ObserveModelMixin from '../../ObserveModelMixin';

import triggerResize from '../../../Core/triggerResize';

import Styles from './full_screen_button.scss';
import classNames from "classnames";

// The button to make the map full screen and hide the workbench.
const FullScreenButton = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired,
        animationDuration: React.PropTypes.number // Defaults to 1 millisecond.
    },

    getInitialState() {
        return {
            isActive: false
        };
    },
    toggleFullScreen() {
        this.props.viewState.isMapFullScreen = !this.props.viewState.isMapFullScreen;

        this.props.terria.currentViewer.notifyRepaintRequired();

        // Allow any animations to finish, then trigger a resize.
        setTimeout(function() {
            triggerResize();
        }, this.props.animationDuration || 1);
    },

    renderButtonText() {
        if (this.props.viewState.isMapFullScreen) {
            return <span className={Styles.exit}>Exit Full Screen</span>;
        } else {
            return <span className={Styles.enter}></span>;
        }
    },

    render() {
        let btnClassName = classNames(Styles.btn, {
            [Styles.isActive]: this.props.viewState.isMapFullScreen
        });
        return (<div className='full-screen'><button type='button' onClick={this.toggleFullScreen} title='go to full screen mode' className={btnClassName}>{this.renderButtonText()}</button></div>);
    }
});
module.exports = FullScreenButton;
