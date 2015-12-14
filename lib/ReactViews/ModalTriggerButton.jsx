'use strict';
var React = require('react');
var ModalTriggerButton = React.createClass({
    propTypes: {
      btnText: React.PropTypes.string,
      classNames: React.PropTypes.string,
      callback: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            callback: undefined
        };
    },

    controlModal: function(e) {
        //open modal window
        window.openModalWindow.raiseEvent();
        if ((this.props.callback !== undefined) && (typeof this.props.callback === 'function')){
            this.props.callback();
        }
    },

    render: function() {
        return (<button onClick={this.controlModal} className={'btn ' + this.props.classNames}>{this.props.btnText}</button>);
    }
});
module.exports = ModalTriggerButton;
