'use strict';
var React = require('react');
var ModalTriggerButton = React.createClass({
    propTypes: {
      btnText: React.PropTypes.string,
      classNames: React.PropTypes.string
    },

    controlModal: function(e) {
        //open modal window
        window.openModalWindow.raiseEvent();
    },

    render: function() {
        return (<button onClick={this.controlModal} className={'btn ' + this.props.classNames}>{this.props.btnText}</button>);
    }
});
module.exports = ModalTriggerButton;
