'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';

const NotificationWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        title: React.PropTypes.string.reqyuired,
        message: React.PropTypes.string.required,
        onDismiss: React.PropTypes.func.required,
        buttonCaption: React.PropTypes.string
    },

    dismiss() {
        if (this.props.onDismiss) {
            this.props.onDismiss();
        }
    },

    render() {
        const title = this.props.title;
        const message = this.props.message;
        const buttonCaption = this.props.buttonCaption || 'OK';

        return (
            <div className="notification-wrapper is-visible">
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

module.exports = NotificationWindow;
