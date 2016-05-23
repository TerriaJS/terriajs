'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';
import Styles from './notification-window.scss';

const NotificationWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        title: React.PropTypes.string.isRequired,
        message: React.PropTypes.string.isRequired,
        onDismiss: React.PropTypes.func.isRequired,
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
            <div className={Styles.wrapper}>
                <div className={Styles.notification}>
                    <div className={Styles.inner}>
                        <h3 className='title'>{title}</h3>
                        {window.location.host === 'localhost:3001' && title.toLowerCase().indexOf('error') >= 0 &&
                            <div><img src='./build/TerriaJS/images/feature.gif'/></div>
                        }
                        <div className={Styles.body}>{renderMarkdownInReact(message)}</div>
                    </div>
                    <div className={Styles.footer}>
                        <button type='button' className={Styles.btn}onClick={this.dismiss}>{buttonCaption}</button>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = NotificationWindow;
