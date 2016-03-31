'use strict';
const React = require('react');

import triggerResize from '../../../Core/triggerResize';

// The button to make the map full screen and hide the workbench.
const FullScreenButton = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        animationDuration: React.PropTypes.number // Defaults to 1 millisecond.
    },

    getInitialState() {
        return {
            isActive: false
        };
    },
    toggleFullScreen() {
        const body = document.body;
        this.setState({
            isActive: !this.state.isActive
        });

        body.classList.toggle('is-full-screen', !this.state.isActive);
        this.props.terria.currentViewer.notifyRepaintRequired();
        // Allow any animations to finish, then trigger a resize.
        setTimeout(function() {
            triggerResize();
        }, this.props.animationDuration || 1);
    },

    renderButtonText() {
        if (this.state.isActive) {
            return <span className='exit-full-screen'>Exit Full Screen</span>;
        }
        return <span className='enter-full-screen'></span>;
    },

    render() {
        return (<div className='full-screen'><button type='button' onClick={this.toggleFullScreen} title='go to full screen mode' className={'btn btn--map full-screen__button ' + (this.state.isActive ? 'is-active' : '')}>{this.renderButtonText()}</button></div>);
    }
});
module.exports = FullScreenButton;
