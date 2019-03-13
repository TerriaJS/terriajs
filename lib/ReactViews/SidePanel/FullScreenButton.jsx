'use strict';
const React = require('react');
const createReactClass = require('create-react-class');
const PropTypes = require('prop-types');
import ObserveModelMixin from '../ObserveModelMixin';
import triggerResize from '../../Core/triggerResize';
import Styles from './full_screen_button.scss';
import classNames from 'classnames';
import Icon from '../Icon.jsx';

// The button to make the map full screen and hide the workbench.
const FullScreenButton = createReactClass({
    displayName: 'FullScreenButton',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object.isRequired,
        btnText: PropTypes.string,
        minified: PropTypes.bool,
        animationDuration: PropTypes.number // Defaults to 1 millisecond.
    },

    getInitialState() {
        return {
            isActive: false
        };
    },

    toggleFullScreen() {
        this.props.viewState.isMapFullScreen = !this.props.viewState
            .isMapFullScreen;

        // this.props.terria.currentViewer.notifyRepaintRequired();

        // Allow any animations to finish, then trigger a resize.
        setTimeout(function() {
            triggerResize();
        }, this.props.animationDuration || 1);

        // log a GA event
        this.props.terria.analytics.logEvent(
            'toggle full screen',
            this.props.viewState.isMapFullScreen ? 'exit' : 'enter',
            'fullScreen'
        );
    },

    renderButtonText() {
        const btnText = this.props.btnText ? this.props.btnText : null;
        if (this.props.minified) {
            if (this.props.viewState.isMapFullScreen) {
                return <Icon glyph={Icon.GLYPHS.right} />;
            } else {
                return <Icon glyph={Icon.GLYPHS.left} />;
            }
        }
        return (
            <span>
                {btnText}
                <Icon glyph={Icon.GLYPHS.right} />
            </span>
        );
    },

    render() {
        const btnClassName = classNames(Styles.btn, {
            [Styles.isActive]: this.props.viewState.isMapFullScreen,
            [Styles.minified]: this.props.minified
        });

        return (
            <div
                className={classNames(Styles.fullScreen, {
                    [Styles.minifiedFullscreenBtnWrapper]: this.props.minified
                })}
            >
                {this.props.minified && <label className={Styles.toggleWorkbench} htmlFor='toggle-workbench'>{this.props.btnText}</label>}
                <button
                    type='button'
                    id="toggle-workbench"
                    aria-label={this.props.viewState.isMapFullScreen ? 'Show Workbench' : 'Hide Workbench'}
                    onClick={this.toggleFullScreen}
                    className={btnClassName}
                    title={this.props.viewState.isMapFullScreen ? 'Show Workbench' : 'Hide Workbench'}
                >
                    {this.renderButtonText()}
                </button>
            </div>
        );
    }
});
module.exports = FullScreenButton;
