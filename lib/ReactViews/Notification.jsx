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
                 <div className='notification__inner'>
                    <h3>{this.props.notification.title}</h3>
                    <div dangerouslySetInnerHTML={this.renderMessage()} />
                 </div>
                 <div className='notification__side'>
                     <button className='btn' onClick={this.dismissNotification}>
                        <i className='icon icon-close'></i>
                     </button>
                 </div>
               </div>;
    }
});
module.exports = Notification;
