'use strict';

import ObserveModelMixin from './ObserveModelMixin';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import React from 'react';

const Notification = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],

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
            <div className='notification' aria-hidden={ !this.props.isVisible }>
              <div className='notification__inner'>
                <h3>{ this.props.title }</h3>
                <div dangerouslySetInnerHTML={ this.renderMessage() } />
              </div>
              <div className='notification__side'>
                <button className='btn' onClick={ this.props.onDismiss }>
                  <i className='icon icon-close'></i>
                </button>
              </div>
            </div>);
    }
});

module.exports = Notification;
