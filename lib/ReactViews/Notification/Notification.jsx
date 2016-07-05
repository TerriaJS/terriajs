'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import NotificationWindow from './NotificationWindow';

const Notification = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object
    },

    confirm() {
        const notification = this.props.viewState.notifications[0];
        if (notification && notification.confirmAction) {
            notification.confirmAction();
        }

        this.props.viewState.notifications.splice(0, 1);
    },

    deny() {
        const notification = this.props.viewState.notifications[0];
        if (notification && notification.denyAction) {
            notification.denyAction();
        }

        this.props.viewState.notifications.splice(0, 1);
    },

    render() {
        const notification = this.props.viewState.notifications[0] || null;
        return notification && (
            <NotificationWindow
                title={notification.title}
                message={notification.message}
                confirmText={notification.confirmText}
                denyText={notification.denyText}
                onConfirm={this.confirm}
                onDeny={this.deny}
            />);
    }
});

module.exports = Notification;
