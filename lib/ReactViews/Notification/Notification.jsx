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
    renderMessage() {
        // TODO: render markdown and sanitize HTML
        return {
            __html: this.props.body
        };
    },

    render() {
        let isVisible = false;
        let title = '';
        let message = '';

        if (defined(this.props.notification)) {
            isVisible = true;
            title = this.props.notification.title;
            message = this.props.notification.message;
        }

        return (
              <div className='notification-wrapper' aria-hidden={!isVisible}>
                <div className='notification'>
                    <div className='notification__inner'>
                      <h3 className='title' >{title}</h3>
                      <div className='body'>{renderMarkdownInReact(message)}</div>
                    </div>
                    <div className='notification__footer'>
                      <button className='btn'
                              onClick={this.props.onDismiss}>OK</button>
                    </div>
                </div>
              </div>);
    }
});

module.exports = Notification;
