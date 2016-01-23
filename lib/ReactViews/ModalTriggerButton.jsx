'use strict';
const React = require('react');

// Any button that triggers a modal open with a callback (e.g., go to a certain tab, enabled a preview, etc)
const ModalTriggerButton = React.createClass({
    propTypes: {
        btnHtml: React.PropTypes.string,
        classNames: React.PropTypes.string,
        callback: React.PropTypes.func,
        activeTab: React.PropTypes.number
    },

    getDefaultProps() {
        return {
            callback: null,
            btnHtml: null,
            activeTab: 0
        };
    },

    controlModal() {
        // open modal window
        window.openModalWindow.raiseEvent(this.props.activeTab);
        if ((this.props.callback) && (typeof this.props.callback === 'function')) {
            this.props.callback();
        }
    },

    renderBtnHtml() {
        return {
            __html: this.props.btnHtml
        };
    },

    render() {
        return (<button onClick={this.controlModal} className={'btn ' + this.props.classNames} dangerouslySetInnerHTML={this.renderBtnHtml()}></button>);
    }
});
module.exports = ModalTriggerButton;
