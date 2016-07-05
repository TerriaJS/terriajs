'use strict';
const React = require('react');
import ObserveModelMixin from '../../ObserveModelMixin';
import triggerResize from '../../../Core/triggerResize';
import Styles from './full_screen_button.scss';
import classNames from "classnames";
import Icon from "../../Icon.jsx";

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
            return <Icon glyph={Icon.GLYPHS.expand}/>;
        }
    },

    render() {
        const btnClassName = classNames(Styles.btn, {
            [Styles.isActive]: this.props.viewState.isMapFullScreen
        });
        return (
            <div className={Styles.fullScreen}>
                <button type='button' onClick={this.toggleFullScreen} title='go to full screen mode'
                        className={btnClassName}><span>{this.renderButtonText()}</span></button>
            </div>
        );
    }
});
module.exports = FullScreenButton;
