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
        confirmText: React.PropTypes.string,
        denyText: React.PropTypes.string,
        onConfirm: React.PropTypes.func.isRequired,
        onDeny: React.PropTypes.func.isRequired
    },

    confirm() {
        if (this.props.onConfirm) {
            this.props.onConfirm();
        }
    },

    deny() {
        if (this.props.onDeny) {
            this.props.onDeny();
        }
    },

    render() {
        const title = this.props.title;
        const message = this.props.message;
        const confirmText = this.props.confirmText || 'OK';
        const denyText = this.props.denyText;

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
                        <button type='button' className={Styles.btn} onClick={this.confirm}>{confirmText}</button>
                        <If condition={denyText}>
                            <button type='button' className={Styles.btn} onClick={this.deny}>{denyText}</button>
                        </If>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = NotificationWindow;
