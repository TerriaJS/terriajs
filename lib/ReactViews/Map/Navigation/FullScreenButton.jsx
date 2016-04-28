'use strict';
const React = require('react');
import ObserveModelMixin from '../../ObserveModelMixin';

import triggerResize from '../../../Core/triggerResize';

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
        this.props.viewState.isFullScreen = !this.props.viewState.isFullScreen;

        this.props.terria.currentViewer.notifyRepaintRequired();

        // Allow any animations to finish, then trigger a resize.
        setTimeout(function() {
            triggerResize();
        }, this.props.animationDuration || 1);
    },

    renderButtonText() {
        if (this.props.viewState.isFullScreen) {
            return <span className='exit-full-screen'>Exit Full Screen</span>;
        } else {
            return <span className='enter-full-screen'></span>;
        }
    },

    render() {
        return (<div className='full-screen'><button type='button' onClick={this.toggleFullScreen} title='go to full screen mode' className={'btn btn--map full-screen__button ' + (this.props.viewState.isFullScreen ? 'is-active' : '')}>{this.renderButtonText()}</button></div>);
    }
});
module.exports = FullScreenButton;
