'use strict';

import classNames from 'classnames';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import parseCustomMarkdownToReact from '../Custom/parseCustomMarkdownToReact';
import Styles from './notification-window.scss';

const NotificationWindow = createReactClass({
    displayName: 'NotificationWindow',
    mixins: [ObserveModelMixin],

    propTypes: {
        title: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired,
        confirmText: PropTypes.string,
        denyText: PropTypes.string,
        onConfirm: PropTypes.func.isRequired,
        onDeny: PropTypes.func.isRequired,
        type: PropTypes.string,
        height: PropTypes.oneOfType([PropTypes.string,PropTypes.number]),
        width: PropTypes.oneOfType([PropTypes.string,PropTypes.number])
    },

    confirm(e) {
        e.stopPropagation();
        if (this.props.onConfirm) {
            this.props.onConfirm();
        }
    },

    deny(e) {
        e.stopPropagation();
        if (this.props.onDeny) {
            this.props.onDeny();
        }
    },

    render() {
        const title = this.props.title;
        const message = this.props.message;
        const confirmText = this.props.confirmText || 'OK';
        const denyText = this.props.denyText;
        const type = this.props.type;

        const divStyle = {
          height: defined(this.props.height) ? this.props.height : 'auto',
          width: defined(this.props.width) ? this.props.width : '500px',
        };

        return (
            <div className={classNames(Styles.wrapper,`${type}`)}>
                <div className={Styles.notification}>
                    <div className={Styles.inner} style={divStyle}>
                        <h3 className='title'>{title}</h3>
                        {window.location.host === 'localhost:3001' && title.toLowerCase().indexOf('error') >= 0 &&
                            <div><img src='./build/TerriaJS/images/feature.gif'/></div>
                        }
                        <div className={Styles.body}>{parseCustomMarkdownToReact(message)}</div>
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
    },
});

module.exports = NotificationWindow;
