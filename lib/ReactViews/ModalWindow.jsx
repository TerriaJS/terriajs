'use strict';
var React = require('react');
var Tabs = require('./Tabs.jsx');
var ModalWindow = React.createClass({
  propTypes:{
    terria: React.PropTypes.object
  },

    getInitialState: function() {
        return {
            isOpen: true
        };
    },

    componentWillMount: function() {
        var that = this;
        window.openModalWindow.addEventListener(function() {
            that.setState({
                isOpen: true
            });
        });
    },

    closeModal: function(e) {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },



    render: function() {
        return (<div className="data-panel-wrapper modal-wrapper fixed flex flex-center" id="data-panel-wrapper" aria-hidden={!this.state.isOpen}>
      <div onClick={this.closeModal} id="data-panel-overlay" className="modal-overlay absolute" tabIndex="-1"></div>
      <div id="data-panel" className="data-panel modal-content mx-auto v-middle" aria-labelledby="modalTitle" aria-describedby="modalDescription" role="dialog">
      <button onClick={this.closeModal} className="btn btn-close-modal" title="Close data panel" data-target="close-modal">Back to Map</button>
      <Tabs terria={this.props.terria}/>
      </div>
      </div>);
    }
});
module.exports = ModalWindow;
