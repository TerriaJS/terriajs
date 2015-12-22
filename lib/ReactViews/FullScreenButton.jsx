'use strict';
var React = require('react');

// the button to make the map full screen(hide the workbench)
var FullScreenButton = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            isActive: false
        };
    },

    toggleFullScreen: function(e){
        var body = document.body;
        this.setState({
          isActive : !this.state.isActive
        });

        body.classList.toggle('is-full-screen', !this.state.isActive);
        this.props.terria.currentViewer.notifyRepaintRequired();
    },

    render: function() {
        return <div><button onClick={this.toggleFullScreen} title='go to full screen mode' className={'btn btn-full-screen ' + (this.state.isActive ? 'is-active' : '')}><i className='icon icon-full-screen'></i><span className='exit-full-screen'>Exit Full Screen</span></button></div>;
    }
});
module.exports = FullScreenButton;
