'use strict';
const React = require('react');
const Notification = React.createClass({
    propTypes: {
        notification: React.PropTypes.object,
        notificationisShow: React.PropTypes.bool,
        dismissNotification: React.PropTypes.func
    },
    renderMessage() {
        return {__html: this.props.notification.body};
    },

    dismissNotification() {
        this.props.dismissNotification();
    },

    render() {
        return <div className='notification' aria-hidden={ !this.props.notificationisShow }>
                 <h3>{this.props.notification.title}</h3>
                 <div dangerouslySetInnerHTML={this.renderMessage()} />
                 <button className='btn btn-primary' onClick={this.dismissNotification}> Dismiss </button>
               </div>;
    }
});
module.exports = Notification;
