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
        return <i className='icon icon-full-screen'></i>;
    },

    render() {
        return (<div><button onClick={this.toggleFullScreen} title='go to full screen mode' className={'btn btn-map btn-full-screen ' + (this.state.isActive ? 'is-active' : '')}>{this.renderButtonText()}</button></div>);
    }
});
module.exports = FullScreenButton;
