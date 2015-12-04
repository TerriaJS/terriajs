'use strict';
var FullScreenButton = React.createClass({
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
    },

    render: function() {
        return <div><button onClick={this.toggleFullScreen} className={'btn btn-map btn-full-screen ' + (this.state.isActive ? 'is-active' : '')}><i className='icon icon-full-screen'></i></button></div>;
    }
});
module.exports = FullScreenButton;
