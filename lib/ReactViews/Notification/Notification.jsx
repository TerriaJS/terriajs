'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';

const Notification = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        notification: React.PropTypes.object,
        onDismiss: React.PropTypes.func
    },

    dismiss() {
        if (this.props.onDismiss) {
            this.props.onDismiss();
        }

        if (this.props.notification && this.props.notification.confirmAction) {
            this.props.notification.confirmAction();
        }
    },

    render() {
        let isVisible = false;
        let title = '';
        let message = '';
        let buttonCaption = 'OK';

        if (defined(this.props.notification)) {
            isVisible = true;
            title = this.props.notification.title;
            message = this.props.notification.message;
            buttonCaption = this.props.notification.confirmText.length ? this.props.notification.confirmText : buttonCaption;
        }

        return (
            <div className={`notification-wrapper ${isVisible ? 'is-visible' : ''}`} aria-hidden={!isVisible}>
                <div className='notification'>
                    <div className='notification__inner'>
                        <h3 className='title'>{title}</h3>
                        {window.location.host === 'localhost:3001' && title.toLowerCase().indexOf('error') >= 0 &&
                            <div><img src='./build/TerriaJS/images/feature.gif'/></div>
                        }
                        <div className='body'>{renderMarkdownInReact(message)}</div>
                    </div>
                    <div className='notification__footer'>
                        <button type='button' className='btn' onClick={this.dismiss}>{buttonCaption}</button>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = Notification;
