'use strict';

import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

const Notification = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        isVisible: React.PropTypes.bool,
        title: React.PropTypes.string,
        body: React.PropTypes.string,
        onDismiss: React.PropTypes.func
    },
    renderMessage() {
        // TODO: render markdown and sanitize HTML
        return {
            __html: this.props.body
        };
    },

    render() {
        return (
            <div className='notification-wrapper flex flex-center' aria-hidden={ !this.props.isVisible }>
              <div className='notification mx-auto'>
                  <div className='notification__inner'>
                    <h3 className='title' >{ this.props.title }</h3>
                    <div className='body' dangerouslySetInnerHTML={ this.renderMessage() } />
                  </div>
                  <div className='notification__footer'>
                    <button className='btn'
                            onClick={ this.props.onDismiss }>OK</button>
                  </div>
              </div>
            </div>);
    }
});

module.exports = Notification;
