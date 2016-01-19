'use strict';
var React = require('react');

// Any button that triggers a modal open with a callback (e.g., go to a certain tab, enabled a preview, etc)
var ModalTriggerButton = React.createClass({
    propTypes: {
      btnHtml: React.PropTypes.string,
      classNames: React.PropTypes.string,
      callback: React.PropTypes.func,
      activeTab: React.PropTypes.number
    },

    getDefaultProps: function() {
        return {
            callback: undefined,
            btnHtml: undefined,
            activeTab: 0
        };
    },

    controlModal: function(e) {
        //open modal window
        window.openModalWindow.raiseEvent(this.props.activeTab);
        if ((this.props.callback !== undefined) && (typeof this.props.callback === 'function')){
            this.props.callback();
        }
    },

    render: function() {
        let btnHtml = () =>{return {__html: this.props.btnHtml};};
        return (<button onClick={this.controlModal} className={'btn ' + this.props.classNames} dangerouslySetInnerHTML={btnHtml()}></button>);
    }
});
module.exports = ModalTriggerButton;
