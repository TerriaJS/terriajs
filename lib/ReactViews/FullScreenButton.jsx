'use strict';
const React = require('react');

// the button to make the map full screen(hide the workbench)
const FullScreenButton = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
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
    },

    renderButtonText() {
        if (this.state.isActive) {
            return <span className='exit-full-screen'>Exit Full Screen</span>;
        }
        return <span className='enter-full-screen'></span>;
    },

    render() {
        return (<div className='full-screen'><button onClick={this.toggleFullScreen} title='go to full screen mode' className={'btn btn--map full-screen__button ' + (this.state.isActive ? 'is-active' : '')}>{this.renderButtonText()}</button></div>);
    }
});
module.exports = FullScreenButton;
